# EKS Monitoring Setup with Prometheus and Grafana

This guide explains how to install and configure **Prometheus, Grafana, Node Exporter, and Kube State Metrics** on an Amazon EKS cluster using Helm.

It also explains how to expose Prometheus and Grafana through AWS LoadBalancers and access them from a web browser.

---

## 1. Prerequisites

Make sure the following are installed and configured:

- AWS CLI
- kubectl
- Helm
- Terraform (if your EKS cluster is created using Terraform)
- An active EKS cluster
- EBS CSI Driver
- A Kubernetes StorageClass named `ebs-sc`

Check your cluster:

```bash
kubectl get nodes
```

Expected output:

```text
NAME                                          STATUS   ROLES    AGE   VERSION
ip-10-0-0-xxx.ap-south-1.compute.internal   Ready    <none>   ...   ...
```

---

# 2. Install Helm

Install Helm using the official installation guide:

https://helm.sh/docs/intro/install/

Verify the installation:

```bash
helm version
```

Example:

```text
version.BuildInfo{Version:"v3.x.x", ...}
```

---

# 3. Configure EKS Access

Make sure your AWS CLI is configured:

```bash
aws configure
```

Update your kubeconfig:

```bash
aws eks update-kubeconfig --region ap-south-1 --name YOUR-EKS-CLUSTER-NAME
```

Verify access:

```bash
kubectl get nodes
```

Replace:

```text
YOUR-EKS-CLUSTER-NAME
```

with your actual EKS cluster name.

---

# 4. Verify EBS CSI Driver

Prometheus requires persistent storage.

Check whether the EBS CSI driver is installed:

```bash
kubectl get pods -n kube-system | grep ebs
```

You can also check the EBS CSI addon:

```bash
aws eks list-addons --cluster-name YOUR-EKS-CLUSTER-NAME --region ap-south-1
```

Look for:

```text
aws-ebs-csi-driver
```

---

# 5. Create the EBS StorageClass

Check existing StorageClasses:

```bash
kubectl get storageclass
```

You should have:

```text
ebs-sc
```

If `ebs-sc` does not exist, create it.

Create:

```bash
nano ebs-sc.yaml
```

Add:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
parameters:
  type: gp3
  fsType: ext4
```

Apply:

```bash
kubectl apply -f ebs-sc.yaml
```

Verify:

```bash
kubectl get storageclass
```

Expected:

```text
NAME      PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE
ebs-sc    ebs.csi.aws.com         Delete          WaitForFirstConsumer
```

---

# 6. Add Prometheus Community Helm Repository

Add the repository:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
```

Update Helm repositories:

```bash
helm repo update
```

Verify:

```bash
helm repo list
```

You should see:

```text
prometheus-community
```

---

# 7. Create Monitoring Namespace

Create the namespace:

```bash
kubectl create namespace monitoring
```

Or let Helm create it automatically during installation.

Check:

```bash
kubectl get namespaces
```

---

# 8. Create values.yaml

Create the configuration file:

```bash
nano values.yaml
```

Add:

```yaml
alertmanager:
  enabled: false

prometheus:
  prometheusSpec:
    service:
      type: LoadBalancer

    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: ebs-sc
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 5Gi

grafana:
  enabled: true

  service:
    type: LoadBalancer

  adminUser: admin
  adminPassword: admin123

nodeExporter:
  service:
    type: LoadBalancer

kubeStateMetrics:
  enabled: true

  service:
    type: LoadBalancer

additionalScrapeConfigs:
  - job_name: node-exporter
    static_configs:
      - targets:
          - node-exporter:9100

  - job_name: kube-state-metrics
    static_configs:
      - targets:
          - kube-state-metrics:8080
```

Save the file.

> **Security note:** `adminPassword: admin123` is suitable only for a lab/demo environment. Use a strong password or Kubernetes Secret for production.

---

# 9. Install Prometheus and Grafana

Install the kube-prometheus-stack:

```bash
helm upgrade --install monitoring \
  prometheus-community/kube-prometheus-stack \
  -f values.yaml \
  -n monitoring \
  --create-namespace
```

Check the Helm release:

```bash
helm list -n monitoring
```

Expected:

```text
NAME         NAMESPACE    STATUS
monitoring   monitoring   deployed
```

---

# 10. Check Monitoring Pods

Run:

```bash
kubectl get pods -n monitoring
```

You should see components such as:

```text
monitoring-grafana
monitoring-kube-prometheus-prometheus-...
monitoring-kube-state-metrics-...
monitoring-prometheus-node-exporter-...
```

Wait until the pods show:

```text
Running
```

You can continuously monitor them:

```bash
kubectl get pods -n monitoring -w
```

Press:

```text
Ctrl + C
```

to stop watching.

---

# 11. Check Monitoring Services

Run:

```bash
kubectl get svc -n monitoring
```

You should see services similar to:

```text
NAME                                      TYPE           EXTERNAL-IP
monitoring-grafana                        LoadBalancer   ...
monitoring-kube-prometheus-prometheus     LoadBalancer   ...
monitoring-kube-state-metrics             LoadBalancer   ...
monitoring-prometheus-node-exporter      LoadBalancer   ...
```

The `EXTERNAL-IP` may initially show:

```text
<pending>
```

Wait a few minutes for AWS to provision the LoadBalancer.

Check again:

```bash
kubectl get svc -n monitoring
```

---

# 12. Patch Prometheus Service to LoadBalancer

If Prometheus is not already exposed as a LoadBalancer, run:

```bash
kubectl patch svc monitoring-kube-prometheus-prometheus \
  -n monitoring \
  -p '{"spec": {"type": "LoadBalancer"}}'
```

Verify:

```bash
kubectl get svc monitoring-kube-prometheus-prometheus -n monitoring
```

---

# 13. Patch Grafana Service to LoadBalancer

The `values.yaml` already configures Grafana as a LoadBalancer.

Verify:

```bash
kubectl get svc monitoring-grafana -n monitoring
```

If required, patch it manually:

```bash
kubectl patch svc monitoring-grafana \
  -n monitoring \
  -p '{"spec": {"type": "LoadBalancer"}}'
```

---

# 14. Patch Kube State Metrics

Run:

```bash
kubectl patch svc monitoring-kube-state-metrics \
  -n monitoring \
  -p '{"spec": {"type": "LoadBalancer"}}'
```

Verify:

```bash
kubectl get svc monitoring-kube-state-metrics -n monitoring
```

---

# 15. Patch Node Exporter

Run:

```bash
kubectl patch svc monitoring-prometheus-node-exporter \
  -n monitoring \
  -p '{"spec": {"type": "LoadBalancer"}}'
```

Verify:

```bash
kubectl get svc monitoring-prometheus-node-exporter -n monitoring
```

> **Important:** Node Exporter and Kube State Metrics normally do not need public LoadBalancers. For a production EKS setup, keep these services internal and expose only Grafana/Prometheus as appropriate.

---

# 16. Get Prometheus Browser URL

Run:

```bash
kubectl get svc monitoring-kube-prometheus-prometheus \
  -n monitoring
```

Look at the `EXTERNAL-IP` or AWS hostname.

For example:

```text
NAME                                   TYPE           EXTERNAL-IP
monitoring-kube-prometheus-prometheus LoadBalancer   abc123.elb.amazonaws.com
```

Get only the hostname:

```bash
kubectl get svc monitoring-kube-prometheus-prometheus \
  -n monitoring \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Example output:

```text
abc123.ap-south-1.elb.amazonaws.com
```

Open in your browser:

```text
http://abc123.ap-south-1.elb.amazonaws.com
```

If your Prometheus service exposes a different port, check:

```bash
kubectl get svc monitoring-kube-prometheus-prometheus -n monitoring
```

Usually the Prometheus web interface is available on port:

```text
9090
```

If required:

```text
http://abc123.ap-south-1.elb.amazonaws.com:9090
```

---

# 17. Get Grafana Browser URL

Run:

```bash
kubectl get svc monitoring-grafana -n monitoring
```

Get only the external hostname:

```bash
kubectl get svc monitoring-grafana \
  -n monitoring \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Example:

```text
xyz456.ap-south-1.elb.amazonaws.com
```

Open:

```text
http://xyz456.ap-south-1.elb.amazonaws.com
```

Grafana normally listens on:

```text
80
```

when exposed through the Kubernetes LoadBalancer service.

---

# 18. Grafana Login

Use the credentials configured in `values.yaml`:

```text
Username: admin
Password: admin123
```

For a production environment, do NOT use these default credentials.

---

# 19. Get Grafana Password from Kubernetes Secret

If you want to retrieve the password from the Grafana Secret:

```bash
kubectl get secret monitoring-grafana \
  -n monitoring \
  -o jsonpath="{.data.admin-password}" | base64 --decode
```

If the Secret name differs, find it with:

```bash
kubectl get secrets -n monitoring | grep grafana
```

---

# 20. Verify Prometheus Targets

After opening Prometheus in the browser:

Go to:

```text
Status → Target health
```

You should see monitoring targets such as:

```text
kube-state-metrics
node-exporter
kubelet
kube-apiserver
kube-controller-manager
kube-scheduler
```

Targets should show:

```text
UP
```

You can also open:

```text
http://PROMETHEUS-LOADBALANCER:9090/targets
```

---

# 21. Verify Prometheus Metrics

In the Prometheus web UI, try:

```promql
up
```

You should receive metric results.

Try:

```promql
node_cpu_seconds_total
```

You can also check memory:

```promql
node_memory_MemAvailable_bytes
```

Kubernetes pod information:

```promql
kube_pod_info
```

---

# 22. Configure Grafana Prometheus Data Source

In Grafana:

```text
Connections
        ↓
Data Sources
        ↓
Add data source
        ↓
Prometheus
```

For a standard kube-prometheus-stack installation, the Prometheus service is available inside the Kubernetes cluster.

Use:

```text
http://monitoring-kube-prometheus-prometheus:9090
```

Then click:

```text
Save & test
```

You should receive:

```text
Successfully queried the Prometheus API.
```

> If Grafana and Prometheus are in the same `monitoring` namespace, the short Kubernetes service name normally works. If needed, use the full DNS name:
>
> `http://monitoring-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090`

---

# 23. Import a Kubernetes Dashboard

In Grafana:

```text
Dashboards
    ↓
New
    ↓
Import
```

You can import a Kubernetes dashboard from the Grafana dashboard catalog.

Select a Kubernetes dashboard and configure its Prometheus data source.

After importing, you can monitor:

- CPU usage
- Memory usage
- Pod status
- Node status
- Namespace usage
- Container resource usage
- Kubernetes workloads
- Network traffic
- Cluster health

---

# 24. Useful Monitoring Commands

### Check all monitoring resources

```bash
kubectl get all -n monitoring
```

### Check pods

```bash
kubectl get pods -n monitoring
```

### Check services

```bash
kubectl get svc -n monitoring
```

### Check persistent volumes

```bash
kubectl get pv
```

### Check persistent volume claims

```bash
kubectl get pvc -n monitoring
```

### Check StorageClass

```bash
kubectl get storageclass
```

### Check Helm release

```bash
helm list -n monitoring
```

### Check Helm values

```bash
helm get values monitoring -n monitoring
```

### Check Grafana logs

```bash
kubectl logs deployment/monitoring-grafana -n monitoring
```

### Check Prometheus logs

```bash
kubectl logs statefulset/monitoring-kube-prometheus-prometheus -n monitoring
```

If the Prometheus resource is managed by the operator, first find the pod:

```bash
kubectl get pods -n monitoring | grep prometheus
```

Then:

```bash
kubectl logs <PROMETHEUS-POD-NAME> -n monitoring
```

---

# 25. Quick Commands to Get Both URLs

### Prometheus

```bash
echo "Prometheus:"
kubectl get svc monitoring-kube-prometheus-prometheus \
  -n monitoring \
  -o jsonpath='http://{.status.loadBalancer.ingress[0].hostname}:9090'
echo
```

### Grafana

```bash
echo "Grafana:"
kubectl get svc monitoring-grafana \
  -n monitoring \
  -o jsonpath='http://{.status.loadBalancer.ingress[0].hostname}'
echo
```

---

# 26. Complete Deployment Flow

Run the following steps in order:

```bash
# 1. Check EKS
kubectl get nodes

# 2. Add Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# 3. Update repository
helm repo update

# 4. Check StorageClass
kubectl get storageclass

# 5. Install monitoring stack
helm upgrade --install monitoring \
  prometheus-community/kube-prometheus-stack \
  -f values.yaml \
  -n monitoring \
  --create-namespace

# 6. Check pods
kubectl get pods -n monitoring

# 7. Check services
kubectl get svc -n monitoring

# 8. Patch Prometheus
kubectl patch svc monitoring-kube-prometheus-prometheus \
  -n monitoring \
  -p '{"spec": {"type": "LoadBalancer"}}'

# 9. Patch Grafana
kubectl patch svc monitoring-grafana \
  -n monitoring \
  -p '{"spec": {"type": "LoadBalancer"}}'

# 10. Get Prometheus URL
kubectl get svc monitoring-kube-prometheus-prometheus \
  -n monitoring

# 11. Get Grafana URL
kubectl get svc monitoring-grafana \
  -n monitoring
```

---

# 27. Browser Access

After AWS finishes creating the LoadBalancers:

### Prometheus

```text
http://<PROMETHEUS-EXTERNAL-HOSTNAME>:9090
```

Example:

```text
http://a1b2c3d4.ap-south-1.elb.amazonaws.com:9090
```

### Grafana

```text
http://<GRAFANA-EXTERNAL-HOSTNAME>
```

Example:

```text
http://x1y2z3.ap-south-1.elb.amazonaws.com
```

---

# 28. Architecture

```text
                         Internet
                            |
              +-------------+-------------+
              |                           |
        AWS LoadBalancer            AWS LoadBalancer
              |                           |
              v                           v
        Prometheus :9090             Grafana :80
              |                           |
              +-------------+-------------+
                            |
                     EKS Monitoring
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
   Node Exporter      Kube State Metrics   Kubernetes
        |                   |               Metrics
        +-------------------+-------------------+
                            |
                       EKS Cluster
                            |
                     Persistent Storage
                            |
                       EBS CSI Driver
                            |
                          AWS EBS
```

---

# 29. Troubleshooting

## LoadBalancer shows `<pending>`

Check:

```bash
kubectl describe svc monitoring-grafana -n monitoring
```

Also check:

```bash
kubectl get events -n monitoring --sort-by=.lastTimestamp
```

---

## Prometheus pod is Pending

Check:

```bash
kubectl get pvc -n monitoring
```

Then:

```bash
kubectl describe pvc -n monitoring
```

Verify:

```bash
kubectl get storageclass
```

Make sure:

```text
ebs-sc
```

exists and the EBS CSI driver is installed.

---

## Grafana is not accessible

Check:

```bash
kubectl get pods -n monitoring
kubectl get svc monitoring-grafana -n monitoring
```

Check Grafana logs:

```bash
kubectl logs deployment/monitoring-grafana -n monitoring
```

---

## Prometheus is not accessible

Check:

```bash
kubectl get pods -n monitoring | grep prometheus
```

Check service:

```bash
kubectl get svc monitoring-kube-prometheus-prometheus -n monitoring
```

Check endpoints:

```bash
kubectl get endpoints monitoring-kube-prometheus-prometheus -n monitoring
```

---

# 30. Uninstall Monitoring Stack

If you want to remove the monitoring stack:

```bash
helm uninstall monitoring -n monitoring
```

Check resources:

```bash
kubectl get all -n monitoring
```

Delete the namespace if no longer needed:

```bash
kubectl delete namespace monitoring
```

Check persistent volumes:

```bash
kubectl get pv
```

---

# 31. Production Recommendations

For production EKS environments:

- Do not expose Node Exporter publicly.
- Do not expose Kube State Metrics publicly.
- Use authentication and HTTPS for Grafana.
- Use a strong Grafana password.
- Store credentials in Kubernetes Secrets.
- Use AWS Load Balancer Controller where appropriate.
- Restrict access using security groups/network policies.
- Use private/internal LoadBalancers where possible.
- Configure Alertmanager instead of disabling it.
- Use appropriate Prometheus retention and storage sizing.
- Enable TLS.
- Consider AWS Managed Prometheus for production-scale monitoring.

---

## Final Verification

Run:

```bash
kubectl get pods -n monitoring
kubectl get svc -n monitoring
kubectl get pvc -n monitoring
helm list -n monitoring
```

Everything should be healthy before opening the browser.

### Prometheus

```text
http://<PROMETHEUS-EXTERNAL-HOSTNAME>:9090
```

### Grafana

```text
http://<GRAFANA-EXTERNAL-HOSTNAME>
```

**Default lab Grafana credentials:**

```text
Username: admin
Password: admin123
```

---

## Official Documentation

- Helm: https://helm.sh/docs/intro/install
- Prometheus Community Helm Charts: https://prometheus-community.github.io/helm-charts
- kube-prometheus-stack: https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack
- Grafana: https://grafana.com/docs/grafana/latest/
- Amazon EKS: https://docs.aws.amazon.com/eks/
- Amazon EBS CSI Driver: https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html
