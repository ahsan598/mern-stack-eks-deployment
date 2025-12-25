# 3-Tier MERN App Kubernetes Deployment


```txt
User → Ingress/NodePort → Frontend Service → Frontend Pods (NGINX) 
    → Backend Service → Backend Pods (Node.js) 
    → MongoDB Service → MongoDB StatefulSet → PVC
```


### Complete Deployment Order
```sh
# 1. Namespace (if not exists)
kubectl apply -f namesapce.yaml

# 2. Deploy Database
kubectl apply -f database/

# 3. Deploy Backend
kubectl apply -f backend/

# 4. Deploy Frontend
kubectl apply -f frontend/

# 5. Check status
kubectl get all -n dev
kubectl get pvc -n dev
```

### Install NGINX Ingress Controller
1. Install NGINX Ingress Controller
```sh
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Verify
kubectl get pods -n ingress-nginx
```

2. Add Host Entry (Local Machine)
```sh
127.0.0.1   todo.local
```
Add to:
- Linux/Mac → `/etc/hosts`
- Windows → `C:\Windows\System32\drivers\etc\hosts`

3. Then open
```sh
http://todo.local
```

### Verfifcation Commands
```sh
# Check frontend pods
kubectl get pods -n dev -l app=frontend

# Check logs
kubectl logs -f deployment/frontend -n dev

# Test NGINX config
kubectl exec -it <frontend-pod> -n dev -- nginx -t

# Port forward for testing
kubectl port-forward svc/frontend-service 8080:80 -n dev
# Open: http://localhost:8080

# Test backend proxy
kubectl exec -it <frontend-pod> -n dev -- curl http://backend-service:8080/ok

# Check MongoDB pod
kubectl exec -it mongodb-0 -n dev -- mongosh -u admin -p password123 --authenticationDatabase admin

# Check backend logs
kubectl logs -f deployment/backend -n dev

# Test backend API
kubectl port-forward svc/backend-service 8080:8080 -n dev
curl http://localhost:8080/ok
curl http://localhost:8080/api/tasks
```


### Debug Commands (if issues)
```sh
# Check if ConfigMap loaded
kubectl describe configmap frontend-nginx-config -n dev

# Check volume mount
kubectl exec -it <frontend-pod> -n dev -- cat /etc/nginx/conf.d/default.conf

# Check NGINX logs
kubectl logs <frontend-pod> -n dev

# Test API from frontend pod
kubectl exec -it <frontend-pod> -n dev -- curl http://backend-service.dev.svc.cluster.local:8080/api/tasks
```