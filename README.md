# <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/kubernetes/kubernetes-plain.svg" alt="Kubernetes" width="40"/> MERN Stack Deployment on Kubernetes


### 🎯 Overview
This project focuses on containerizing an **MERN** application and deploying it on **Kubernetes** with routing using **Ingress**.

It is designed to simulate real-world cloud deployment practices, covering:
- **Dockerizing** frontend and backend
- Running **MongoDB** with **persistent storage**
- Deploying the full stack on **Kubernetes**
- Using **ConfigMaps and Secrets**
- Exposing the app using **NGINX Ingress**
- Supporting local clusters (**Kind/Minikube**)

The goal is to provide a hands-on reference implementation for building and deploying **full-stack** application using **Kubernetes**.


### 🛠️ Prerequisites

| Tool        | Purpose                                                   | Documentation |
|-------------|-----------------------------------------------------------|---------------|
| **Node.js** | JavaScript runtime used to build and run the backend service | [Install Node.js](https://nodejs.org/en/download) |
| **npm**     | Package manager for installing and managing dependencies | [npm Documentation](https://docs.npmjs.com/) |
| **Docker**  | Builds and runs container images for application services | [Install Docker](https://docs.docker.com/engine/install/) |
| **KIND** *(or any Kubernetes tool)* | Used to deploy and test the application locally on Kubernetes | [Install Kind](https://kind.sigs.k8s.io/docs/user/quick-start/) |




### ⚙️ Architect Diagram
![architect](/assets/images/architect-diagram-2.png)


### 🧪 Local Testing (Before Kubernetes)

**Step-1: Clone Repository**
```sh
git clone https://github.com/ahsan598/mern-stack-deployment-on-kubernetes.git
cd mern-stack-deployment-on-kubernetes
```

**Step-2: Docker Compose Setup**
```sh
# Build and start all services
docker compose up --build -d

# Check logs
docker compose logs -f

# Verify containers are running
docker compose ps

# Rebuild all (optional)
docker compose build --no-cache

# Start fresh (optional)
docker compose up -d
```

**Step 3: Test Application**
```sh
# Frontend (React UI)
http://localhost:3000

# Backend health check
http://localhost:8080/ok

# Get all tasks
http://localhost:8080/api/tasks
```

**Step 4: Cleanup**
```sh
# Stop and remove containers + volumes
docker compose down -v
```

### 🚀 Kubernetes Deployment

**Step-1: Verify Kubernetes Cluster**
```sh
# Check cluster status
kubectl cluster-info
kubectl get nodes
```

**Step-2: Create Namespace**
```sh
kubectl apply -f k8s_manifests/namespace.yaml

# Verify namespace
kubectl get ns todo-lab
```

**Step-3: Deploy Database Layer (MongoDB)**
```sh
# Apply database manifests
kubectl apply -f k8s_manifests/database/

# Wait for MongoDB to be ready (Important!)
kubectl wait --for=condition=ready pod/mongodb-0 -n todo-lab --timeout=120s

# Verify StatefulSet and PVC
kubectl get statefulset -n todo-lab
kubectl get pvc -n todo-lab

# Check MongoDB logs
kubectl logs mongodb-0 -n todo-lab | grep "Waiting for connections"

# Check MongoDb connectivity
kubectl exec -it mongodb-0 -n dev -- mongosh -u admin -p password123 --authenticationDatabase admin
```
**⏳ Wait Time: ~30-60 seconds for MongoDB initialization with authentication.**


**Step-4: Deploy Backend Layer (Node.js/Express)**
```sh
# Apply backend manifests
kubectl apply -f k8s_manifests/backend/

# Verify pods are running
kubectl get pods -n todo-lab  -l app=todo-backend

# Check backend logs
kubectl logs -f deployment/backend -n todo-lab
# Expected: "Connected to database"
#           "Server running on port 8080..."
```

![database-connection](/assets/images/connection-verify.png)


**Step-5: Deploy Frontend Layer (React/NGINX)**
```sh
# Apply frontend manifests
kubectl apply -f k8s_manifests/frontend/

# Verify pods
kubectl get pods -n todo-lab -l app=todo-frontend
```

**Step-6: Verify All Resources**
```sh
# Check all resources in namespace
kubectl get all -n todo-lab

# Check persistent volumes
kubectl get pvc -n todo-lab

# Check endpoints
kubectl get ep -n todo-lab
```

![deployment](/assets/images/deployment-verify.png)


### 🌐 Expose Application with Ingress

1. Install NGINX Ingress Controller
```sh
# Apply NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.13.3/deploy/static/provider/cloud/deploy.yaml

# Verify installation
kubectl get pods -n ingress-nginx
```

2. Add Host Entry (Local Machine)
**1. Linux/Mac:**
  - Edit `/etc/hosts`
```sh
sudo vi /etc/hosts

# Add this line:
127.0.0.1   todo.local
```
**2. Windows:**
  - Edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator)

**3. Access Application**
```sh
# Forward ingress service to local port (if using Kind)
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8085:80

# Access application
http://localhost:8085
```

![access](/assets/images/browsing-verify.png)



### ✅ Verification & Testing

1. Testing Database
```sh
# Test MongoDB authentication
kubectl exec -it mongodb-0 -n todo-lab -- \
  mongosh -u admin -p password123 --authenticationDatabase admin \
  --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }
```

2. Functional Testing
```sh
# Create a task via API
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"task":"Test Kubernetes deployment","completed":false}'

# Get all tasks
curl http://localhost:8080/api/tasks

# Or test from frontend pod
kubectl exec -it deployment/frontend -n todo-lab -- \
  curl http://backend-svc:8080/api/tasks
```

3. Check Logs
```sh
# Frontend logs
kubectl logs -f deployment/frontend -n todo-lab

# Backend logs
kubectl logs -f deployment/backend -n todo-lab

# MongoDB logs
kubectl logs -f mongodb-0 -n todo-lab

# Ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```


### 🔧 Debug Commands

1. Frontend Issues
```sh
# Check if ConfigMap loaded properly
kubectl describe configmap frontend-nginx-config -n todo-lab

# Verify NGINX config inside pod
kubectl exec -it deployment/frontend -n todo-lab -- cat /etc/nginx/conf.d/default.conf

# Test NGINX syntax
kubectl exec -it deployment/frontend -n todo-lab -- nginx -t

# Test backend connectivity from frontend pod
kubectl exec -it deployment/frontend -n todo-lab -- \
  curl http://backend-svc.todo-lab.svc.cluster.local:8080/ok
```

2. Backend Issues
```sh
# Check environment variables
kubectl exec deployment/backend -n todo-lab -- env | grep MONGO

# Test MongoDB connection from backend pod
kubectl exec -it deployment/backend -n todo-lab -- sh
# Inside pod:
# mongosh mongodb://mongodb-service:27017/todo -u admin -p password123 --authenticationDatabase admin
```

3. Database Issues
```sh
# Check PVC status
kubectl describe pvc mongodb-storage-mongodb-0 -n todo-lab

# Verify data persistence
kubectl exec -it mongodb-0 -n todo-lab -- ls -la /data/db/

# Access MongoDB shell
kubectl exec -it mongodb-0 -n todo-lab -- \
  mongosh -u admin -p password123 --authenticationDatabase admin

# Inside mongosh:
show dbs
use todo
db.tasks.find()
```

4. Network Debugging
```sh
# Test DNS resolution
kubectl run test-pod --image=busybox -n todo-lab -it --rm -- nslookup backend-svc.todo-lab.svc.cluster.local

# Test service connectivity
kubectl run test-pod --image=curlimages/curl -n todo-lab -it --rm -- \
  curl http://backend-svc:8080/ok

# Check service endpoints
kubectl get endpoints -n todo-lab
```


### 🗑️ Cleanup

1. Delete Application
```sh
# Delete all resources in namespace
kubectl delete namespace todo-lab

# Or delete selectively
kubectl delete -f k8s_manifests/frontend/
kubectl delete -f k8s_manifests/backend/
kubectl delete -f k8s_manifests/database/
kubectl delete -f k8s_manifests/namespace.yaml
```

2. Delete Ingress Controller
```sh
kubectl delete -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.13.3/deploy/static/provider/cloud/deploy.yaml
```

3. Reset PVCs (Fresh Database)
```sh
# Delete StatefulSet without cascading deletion
kubectl delete statefulset mongodb -n todo-lab --cascade=orphan

# Delete PVC
kubectl delete pvc mongodb-storage-mongodb-0 -n todo-lab

# Redeploy StatefulSet
kubectl apply -f k8s_manifests/database/statefulset.yaml
```


### 📝 Notes
- MongoDB uses **PVC** — data survives pod restarts
- Backend runs as Deployment
- Frontend uses **NGINX** via **ConfigMap**
- All services are internal (ClusterIP); access via **Ingress**


### 🧾 Summary
This repository contains a **MERN** stack application deployed on **Kubernetes** with:
- React frontend
- Node.js / Express backend
- MongoDB database with persistent volume
- NGINX Ingress for traffic routing
- Kubernetes manifests for complete infrastructure setup


### 🧱 Conclusion
This project is a practical reference for learning **Docker + Kubernetes** by deploying a real multi-tier application stack.


### 📚 References
- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [MongoDB on Kubernetes](https://www.mongodb.com/kubernetes)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [KIND Guide](https://kind.sigs.k8s.io/)
- [Minikube Guide](https://minikube.sigs.k8s.io/docs/start/)

