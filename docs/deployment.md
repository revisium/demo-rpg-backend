# Deployment

## Kubernetes Manifests

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      containers:
        - name: my-app
          image: your-registry/your-project:latest
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: my-app-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: my-app-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

## Production Checklist

- [ ] Set strong `JWT_SECRET` (at least 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `DATABASE_URL` with connection pooling
- [ ] Set `METRICS_ENABLED=true`
- [ ] Configure `PUBLIC_URL` to your actual domain
- [ ] Set up database backups
- [ ] Configure resource limits in K8s
- [ ] Set up monitoring and alerting
- [ ] Review SonarQube quality gate
