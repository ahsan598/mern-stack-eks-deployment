# <img src="https://raw.githubusercontent.com/aws/eks-charts/master/docs/logo/amazon-eks.png" width="40" alt="EKS" /> MERN Todo App - AWS EKS Deployment


### 🎯 Project Overview
This project is a **full-stack MERN (MongoDB, Express, React, Node.js) Todo application** that is deployed on **AWS EKS (Elastic Kubernetes Service)** using modern DevOps and cloud-native practices.

It is designed to help beginners understand how a real production-style application is built, containerized, and deployed on the cloud.

### ⚙️ Architect Diagram
![architect](/assets/architect-diagram.png)

---

### 🛠️ Prerequisites

| Tool | Purpose | Documentation |
|------|---------|---------------|
| **AWS CLI** | Interact with AWS services from command line | [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **eksctl** | Create and manage EKS clusters easily | [Install eksctl](https://eksctl.io/installation/) |
| **kubectl** | Interact with Kubernetes API server | [Install kubectl](https://kubernetes.io/docs/tasks/tools/) |
| **Helm** | Package manager for Kubernetes | [Install Helm](https://helm.sh/docs/intro/install/) |
| **Docker** | Build and test container images locally | [Install Docker](https://docs.docker.com/engine/install/) |


**AWS Account Requirements:**
- Valid AWS account with appropriate IAM permissions
- Configured AWS credentials (`aws configure`)


### 🔧 Local Testing (Docker Compose)
Before deploying to EKS, verify the application works locally.
```sh
# Build and start all services
docker compose up --build -d

# Verify containers are running
docker compose ps

Access the app at http://localhost:3000

# Stop and cleanup
docker compose down -v
```

---

### 📦 ECR Repositories to store docker images

**Step-1: Create ECR Repositories**
```sh
# Create repository for backend
aws ecr create-repository --repository-name mern-backend --region us-east-1

# Create repository for frontend
aws ecr create-repository --repository-name mern-frontend --region us-east-1
```
![ecr-repo](/assets/ecr-repo.png)

**Step-2: Authenticate Docker with ECR**
```sh
# Login to ECR (replace account ID)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

**Step-3: Build and Push Images to AWS ECR**

**1. Backend**
```sh
# Build
docker build -t mern-backend:latest ./backend

# Tag
docker tag mern-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-backend:1.0

# Push
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-backend:1.0

# Verify images
aws ecr list-images --repository-name mern-backend --region us-east-1
```

**2. Frontend (with API proxy path):**
```sh
# Build with relative API URL (since ALB will route /api to backend)
docker build \
  --build-arg VITE_API_URL=/api/tasks \
  -t mern-frontend:latest ./frontend

# Tag
docker tag mern-frontend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-frontend:1.0

# Push
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-frontend:1.0

# Verify images
aws ecr list-images --repository-name mern-frontend --region us-east-1
```


### 🚀 Now Deploy Application to AWS EKS

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
**⏱️ This takes 15-20 minutes. The cluster will be created with VPC, subnets, and security groups automatically.**

![eks-cluster](/assets/eks-cluster.png)

**Step-2: Configure kubectl**
```sh
# Update kubeconfig to connect to your cluster
aws eks update-kubeconfig --region us-east-1 --name mern-cluster

# Verify connection
kubectl get nodes
```

**Step-3: Install AWS EBS CSI Driver (for MongoDB Persistent Storage)**
```sh
# Install EBS CSI Driver
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/?ref=release-1.30"

# Verify installation
kubectl get pods -n kube-system | grep ebs-csi
```

**Important:** Attach the `AmazonEBSCSIDriverPolicy` to your node IAM role:
1. Go to **AWS Console → IAM → Roles**
2. Find your EKS node role (format: `eksctl-mern-cluster-nodegroup-*-NodeInstanceRole-*`)
3. Click **Add permissions → Attach policies**
4. Search and attach: `AmazonEBSCSIDriverPolicy`


**Step-4: Setup AWS Load Balancer Controller**

**a. Enable OIDC Provider**
```sh
eksctl utils associate-iam-oidc-provider --cluster mern-cluster --approve
```

**b. Create IAM Policy**
```sh
# Download policy document
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

# Create IAM policy
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json
```
**Note:** Copy the Policy ARN from the output - you'll need it in the next step.

**c. Create Service Account**
```sh
# Replace <POLICY_ARN> with the ARN from previous step
eksctl create iamserviceaccount \
  --cluster mern-cluster \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --attach-policy-arn <PASTE-POLICY-ARN-HERE> \
  --approve
```

**d. Install Load Balancer Controller via Helm**
```sh
# Add EKS Helm repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=mern-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

**Step-5: Update Image References**

Before applying manifests, update the image URLs in your deployment files:
```sh
# Example: k8s_manifests/backend/deployment.yaml & frontend/deployment.yaml
spec:
  containers:
  - name: backend
    image: <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/mern-backend:1.0
```

**Step-6: Create Namespace**
```sh
kubectl apply -f k8s_manifests/namespace.yaml
```

**Step-7: Deploy MongoDB**
```sh
# Deploy StatefulSet with Persistent Volume
kubectl apply -f k8s_manifests/database/

# Verify MongoDB is running
kubectl get pods -n todo-lab

# Test MongoDB connection
kubectl exec -it mongodb-0 -n todo-lab -- mongosh -u admin -p password123 --authenticationDatabase admin
```
![db-verify](/assets/db-connection-verify.png)


**Step-8: Deploy Backend**
```sh
# Deploy Node.js API
kubectl apply -f k8s_manifests/backend/

# Check logs
kubectl logs -f deployment/backend -n todo-lab
```
![backend-verify](/assets/connection-verify.png)

**Step-9: Deploy Frontend**
```sh
# Deploy React app
kubectl apply -f k8s_manifests/frontend/
```
**Important:** Ensure your frontend and backend services are **ClusterIP** type

**Step-10: Deploy Ingress**
```sh
# Apply Ingress manifest
kubectl apply -f k8s_manifests/ingress.yaml
```

**Step-11: Verify All Resources**
```sh
# Check all resources
kubectl get all -n todo-lab

# Check persistent volumes
kubectl get pvc -n todo-lab

# Check Ingress status
kubectl describe ingress lab-ingress -n todo-lab

# Check ALB in AWS Console
Go to: EC2 → Load Balancers → Find your ALB

# Check service endpoints
kubectl get ep -n todo-lab
```
![eks-workloads](/assets/workloads.png)


**Step-12: Get Application URL**
```sh
# Wait for ALB to provision (takes 3-5 minutes)
kubectl get ingress lab-ingress -n todo-lab -w

# Get the ALB DNS name
kubectl get ingress lab-ingress -n todo-lab -o jsonpath='{.status.loadBalancer.ingress.hostname}'

# Copy the ALB DNS name and open it in your browser!
```
![output](/assets/browsing-verify.png)

---

### 🗑️ Cleanup Resources

**1. Delete Application Resources**
```sh
# Delete namespace (removes all app resources)
kubectl delete namespace todo-lab
```

**2. Delete Load Balancer Controller**
```sh
helm uninstall aws-load-balancer-controller -n kube-system
```

**3. Delete EKS Cluster**
```sh
eksctl delete cluster --name mern-cluster --region us-east-1
```
This will delete all associated AWS resources (VPC, subnets, Load Balancers, etc.).

**4. Delete ECR Repositories**
```sh
aws ecr delete-repository --repository-name mern-backend --region us-east-1 --force
aws ecr delete-repository --repository-name mern-frontend --region us-east-1 --force
```

---

### 🧾 Summary
This setup shows how modern cloud-native applications are built, deployed, and managed at scale.
- Dockerize a **React frontend** and a **Node.js backend**
- Store container images securely in **AWS ECR**
- Run your application on **AWS EKS (Kubernetes)**
- Deploy **MongoDB** with persistent storage using **AWS EBS**
- Manage configuration using **ConfigMaps and Secrets**
- Expose the application to the internet using **AWS Application Load Balancer (ALB) and Kubernetes Ingress**
- Handle persistent data using **AWS EBS CSI Driver**


### 📚 References
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [eksctl Documentation](https://docs.aws.amazon.com/eks/latest/eksctl/what-is-eksctl.html)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/)
- [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)