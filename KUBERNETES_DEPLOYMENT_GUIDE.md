# Phase 4: Local Kubernetes Deployment Guide

This guide covers the complete deployment of the Todo application to a local Kubernetes cluster using the 4-layer mental model.

## Prerequisites

Ensure the following tools are installed and accessible in your WSL (Ubuntu) environment:

```bash
# Verify tools are installed
docker --version
minikube version
kubectl version --client
helm version
```

## Step 1: Login to Docker Hub

Login to Docker Hub with your credentials:

```bash
docker login -u duashakir -p YOUR_PASSWORD
```

## Step 2: Build Docker Images

Build the backend and frontend Docker images:

```bash
# Navigate to project root
cd /mnt/d/phase-3-hackathon-todo-app

# Build backend image
docker build -t duashakir/todo-backend:latest ./backend

# Build frontend image
# First, prepare the Next.js app for standalone build
cd frontend
npm install
npm run build

# Modify the frontend Dockerfile to work with the built app
# We need to make sure the Next.js app is properly configured for standalone output
# Update next.config.js to include experimental.standalone
cd ..

# Build frontend image
docker build -t duashakir/todo-frontend:latest ./frontend
```

## Step 3: Push Images to Docker Hub

Push the built images to Docker Hub:

```bash
# Push backend image
docker push duashakir/todo-backend:latest

# Push frontend image
docker push duashakir/todo-frontend:latest
```

## Step 4: Start Minikube

Start your local Kubernetes cluster:

```bash
# Start Minikube with Docker driver
minikube start --driver=docker

# Enable ingress addon for external access
minikube addons enable ingress

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

## Step 5: Load Images into Minikube (Alternative to Docker Hub)

Instead of pulling from Docker Hub, you can load images directly into Minikube:

```bash
# Load images into Minikube
minikube image load duashakir/todo-backend:latest
minikube image load duashakir/todo-frontend:latest
```

## Step 6: Create Required Secrets

Create the necessary secrets for database and API keys:

```bash
# Create database secret (replace with your actual database URL)
kubectl create secret generic todo-db-secret \
  --from-literal=database_url="postgresql://user:password@postgres-service:5432/todo_db"

# Create Groq API key secret (replace with your actual API key)
kubectl create secret generic groq-api-key \
  --from-literal=api_key="your_groq_api_key_here"
```

## Step 7: Deploy with kubectl

Deploy the application using Kubernetes manifests:

```bash
# Apply all Kubernetes manifests
kubectl apply -f kubernetes/
```

## Step 8: Deploy with Helm

Alternatively, deploy using the Helm chart:

```bash
# Install the Helm chart
helm install todo-app helm/todo-app/

# Or upgrade if already installed
# helm upgrade todo-app helm/todo-app/
```

## Step 9: Verify Deployment

Check that all resources are running properly:

```bash
# Check deployments
kubectl get deployments

# Check services
kubectl get services

# Check pods
kubectl get pods

# Check logs for any issues
kubectl logs -l app=todo-backend
kubectl logs -l app=todo-frontend
```

## Step 10: Access the Application

Access the application through the frontend service:

```bash
# Get the frontend service URL
minikube service frontend-service --url

# Or if using Helm deployment, use the Helm-generated service name
minikube service todo-app-frontend-service --url

# For the actual Helm release name, use:
minikube service RELEASE_NAME-frontend-service --url
# Replace RELEASE_NAME with the name you used during helm install (default is 'todo-app')
```

## Step 11: Test the Deployment

Test that the application is working correctly:

```bash
# Check if the frontend is accessible
curl $(minikube service todo-app-frontend-service --url)

# Or test the backend API
curl $(minikube service todo-app-backend-service --url)/health
```

## Step 12: Cleanup

Remove the deployment when finished:

```bash
# If deployed with Helm
helm uninstall todo-app

# If deployed with kubectl
kubectl delete -f kubernetes/

# Or remove all resources by label
kubectl delete all -l app=todo-backend
kubectl delete all -l app=todo-frontend

# Stop Minikube
minikube stop

# Delete Minikube cluster (optional)
minikube delete
```

## Troubleshooting

### Common Issues:

1. **Image Pull Errors**: If using Docker Hub images, ensure they are pushed correctly and the image names match in your manifests.

2. **Service Not Accessible**: Check that the LoadBalancer service is properly assigned an IP address. With Minikube, you might need to use `minikube tunnel` in a separate terminal.

3. **Database Connection**: Ensure your database is properly configured and accessible from within the cluster.

4. **Environment Variables**: Verify that all required environment variables and secrets are properly configured.

### Useful Commands:

```bash
# Start tunnel for LoadBalancer services (in separate terminal)
minikube tunnel

# Get detailed information about a resource
kubectl describe deployment backend-deployment
kubectl describe service frontend-service

# Follow logs in real-time
kubectl logs -l app=todo-backend -f

# Execute commands inside a pod
kubectl exec -it deployment/backend-deployment -- /bin/sh
```

## Complete Deployment Script

For convenience, here's a complete script to run the entire deployment:

```bash
#!/bin/bash

# Build and push images
cd /mnt/d/phase-3-hackathon-todo-app
docker build -t duashakir/todo-backend:latest ./backend
docker build -t duashakir/todo-frontend:latest ./frontend
docker push duashakir/todo-backend:latest
docker push duashakir/todo-frontend:latest

# Start Minikube
minikube start --driver=docker
minikube addons enable ingress

# Load images (alternative to Docker Hub)
minikube image load duashakir/todo-backend:latest
minikube image load duashakir/todo-frontend:latest

# Create secrets
kubectl create secret generic todo-db-secret \
  --from-literal=database_url="postgresql://user:password@postgres-service:5432/todo_db"
kubectl create secret generic groq-api-key \
  --from-literal=api_key="your_groq_api_key_here"

# Deploy with Helm
helm install todo-app helm/todo-app/

# Get service URL
echo "Application is available at:"
minikube service todo-app-frontend-service --url
```

This completes the local Kubernetes deployment following the 4-layer mental model:
- Layer 1: Your Code (existing Phase 3)
- Layer 2: Docker (containers for backend and frontend)
- Layer 3: Kubernetes (deployments and services)
- Layer 4: Helm (package management and deployment)