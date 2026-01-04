# MERN Todo App - AWS EKS Deployment

A production-ready MERN stack application deployed on **AWS EKS (Elastic Kubernetes Service)** with container images stored in **AWS ECR**.

### 🎯 Overview

This project demonstrates real-world cloud-native deployment practices including:
- **Dockerizing** React frontend and Node.js backend
- Running **MongoDB** with persistent storage on Kubernetes
- Deploying to **AWS EKS** with proper networking
- Using **ConfigMaps and Secrets** for configuration
- Exposing the application using **AWS LoadBalancer**
- Container image management via **AWS ECR**


### 🛠️ Prerequisites

| Tool | Purpose | Documentation |
|------|---------|---------------|
| **AWS CLI** | Interact with AWS services from command line | [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **eksctl** | Create and manage EKS clusters easily | [Install eksctl](https://eksctl.io/installation/) |
| **kubectl** | Interact with Kubernetes API server | [Install kubectl](https://kubernetes.io/docs/tasks/tools/) |
| **Docker** | Build and test container images locally | [Install Docker](https://docs.docker.com/engine/install/) |


**AWS Account Requirements:**
- Valid AWS account with appropriate IAM permissions
- Configured AWS credentials (`aws configure`)


### ⚙️ Architect Diagram
![architect](/assets/architect-diagram.png)


### 🧪 Local Testing (Docker Compose)
Before deploying to EKS, verify the application works locally.
```sh
# Build and start all services
docker compose up --build -d

# Verify containers are running
docker compose ps

# Access the app at http://localhost:3000

# Stop and cleanup
docker compose down -v
```


### 📦 Push Images to AWS ECR

**Step-1: Create ECR Repositories**
```sh
# Create repository for backend
aws ecr create-repository --repository-name mern-backend --region us-east-1

# Create repository for frontend
aws ecr create-repository --repository-name mern-frontend --region us-east-1
```

**Step-2: Authenticate Docker with ECR**
```sh
# Login to ECR (replace account ID)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

**Step-3: Tag and Push Images**
```sh
# Backend
docker tag mern-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-backend:latest

# Frontend
docker tag mern-frontend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-frontend:latest

# Verify images
aws ecr list-images --repository-name mern-backend --region us-east-1
```


### 🚀 Deploy to AWS EKS

**Step-1: Create EKS Cluster**
```sh
eksctl create cluster \
  --name mern-cluster \
  --region us-east-1 \
  --version 1.34 \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 3
```
This takes 15-20 minutes. The cluster will be created with a VPC, subnets, and security groups automatically.


**Step-2: Configure kubectl**
```sh
# Update kubeconfig to connect to your cluster
aws eks update-kubeconfig --region us-east-1 --name mern-cluster

# Verify connection
kubectl get nodes
```

**Step-3: Update Image References**
Before applying manifests, update the image URLs in your Kubernetes YAML files to point to your ECR repositories:
```sh
# Example: k8s_manifests/backend/deployment.yaml
spec:
  containers:
  - name: backend
    image: <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-backend:latest
```

**Step-4: Create Namespace**
```sh
kubectl apply -f k8s_manifests/namespace.yaml
```

**Step-5: Deploy MongoDB**
```sh
# Deploy StatefulSet with Persistent Volume
kubectl apply -f k8s_manifests/database/

# Verify MongoDB is running
kubectl get pods -n todo-lab

# Test MongoDB connection
kubectl exec -it mongodb-0 -n todo-lab -- mongosh -u admin -p password123 --authenticationDatabase admin
```

**Step-6: Deploy Backend**
```sh
# Deploy Node.js API
kubectl apply -f k8s_manifests/backend/

# Check logs
kubectl logs -f deployment/backend -n todo-lab
```

**Step-7: Deploy Frontend**
```sh
# Deploy React app
kubectl apply -f k8s_manifests/frontend/
```
**Important:** Make sure your frontend service is configured as `type: LoadBalancer`

**Step-8: Get Application URL**
```sh
# Wait for LoadBalancer to provision (takes 2-3 minutes)
kubectl get svc frontend -n todo-lab -w

# Get the LoadBalancer URL
kubectl get svc frontend -n todo-lab -o jsonpath='{.status.loadBalancer.ingress.hostname}'
```
Copy the hostname and open it in your browser!

**Step-9: Verify All Resources**
```sh
# Check all resources
kubectl get all -n todo-lab

# Check persistent volumes
kubectl get pvc -n todo-lab

# Check service endpoints
kubectl get ep -n todo-lab
```


### 🗑️ Cleanup

1. Delete Application Resources
```sh
# Delete namespace (removes all app resources)
kubectl delete namespace todo-lab
```

2. Delete EKS Cluster
```sh
eksctl delete cluster --name mern-cluster --region us-east-1
```
This will delete all associated AWS resources (VPC, subnets, Load Balancers, etc.).

3. Delete ECR Repositories (Optional)
```sh
aws ecr delete-repository --repository-name mern-backend --region us-east-1 --force
aws ecr delete-repository --repository-name mern-frontend --region us-east-1 --force
```

### 🧾 Summary
This project deploys a full MERN stack on AWS EKS with:
- React frontend served via NGINX
- Node.js/Express REST API backend
- MongoDB with persistent storage (AWS EBS volumes)
- Container images hosted in AWS ECR
- Direct internet access via AWS LoadBalancer


### 📚 References
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [eksctl Documentation](https://docs.aws.amazon.com/eks/latest/eksctl/what-is-eksctl.html)
- [AWS ECR User Guide](https://docs.aws.amazon.com/ecr/)
- [Kubernetes Service Types](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer)