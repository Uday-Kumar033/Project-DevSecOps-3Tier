# 3-Tier DevSecOps CI/CD Pipeline

A Dockerized 3-tier application with a Jenkins CI/CD pipeline that
performs code validation, secret scanning, SonarQube analysis,
filesystem vulnerability scanning, Docker image scanning, Docker Compose
application testing, Docker Hub publishing, and final deployment.

## Project Repository

-   GitHub: https://github.com/Uday-Kumar033/Project-DevSecOps-3Tier
-   Docker Hub namespace: `mruday033`
-   Backend image: `mruday033/backend:latest`
-   Frontend image: `mruday033/frontend:latest`

------------------------------------------------------------------------

# 1. Project Architecture

``` text
                         GitHub
                           |
                           v
                    Jenkins Pipeline
                           |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
   Compilation          Gitleaks          SonarQube
        |                  |                  |
        +------------------+------------------+
                           |
                           v
                     Quality Gate
                           |
                           v
                      Trivy FS
                           |
                           v
                    Docker Build
                    /           \
                   v             v
             Backend Image   Frontend Image
                   |             |
                   +------+------+
                          |
                          v
                 Trivy Image Scan
                          |
                          v
                Docker Compose Test
                          |
                          v
                 Application Health
                          |
                          v
                 Compose Test Cleanup
                          |
                          v
                    Docker Hub
                    /        \
                   v          v
             backend:latest frontend:latest
                          |
                          v
                  Final Deployment
                          |
                          v
                    Docker Compose
```

------------------------------------------------------------------------

# 2. Application Architecture

The application contains:

``` text
                    Frontend
                 React + Nginx
                      |
                   Port 3000
                      |
                      v
                    Backend
                 Node.js / Express
                      |
                   Port 5000
                      |
                      v
                    MySQL
                   Port 3306
```

Docker Compose services:

``` text
mysql
backend
frontend
```

The frontend Nginx configuration proxies `/api/` requests to the Docker
Compose service:

``` text
backend:5000
```

Do not use the EC2 public IP inside the frontend container for backend
communication.

------------------------------------------------------------------------

# 3. CI/CD Pipeline Flow

The Jenkins pipeline follows this order:

``` text
1. Git Checkout
2. Frontend Compilation
3. Backend Compilation
4. Gitleaks Secret Scan
5. SonarQube Analysis
6. SonarQube Quality Gate
7. Trivy Filesystem Scan
8. Build Backend Docker Image
9. Trivy Backend Image Scan
10. Build Frontend Docker Image
11. Trivy Frontend Image Scan
12. Docker Compose Build
13. Docker Compose Start
14. Application Test
15. Application Logs
16. Docker Compose Test Cleanup
17. Push Backend Image
18. Push Frontend Image
19. Final Docker Compose Deployment
```

The test environment is explicitly stopped after the CI test:

``` bash
docker compose down --remove-orphans
```

The final deployment then starts the application again.

------------------------------------------------------------------------

# 4. Prerequisites

Install the following on the Jenkins agent/server:

  Tool                 Purpose
  -------------------- ----------------------------------------------------
  Git                  Clone the GitHub repository
  Java 21+             Required by current Jenkins releases
  Jenkins              CI/CD automation
  Node.js              Frontend/backend syntax checks and build tools
  Docker Engine        Build and run containers
  Docker Compose V2    Run the 3-tier application
  Gitleaks             Detect secrets
  SonarQube Server     Static code analysis and quality gate
  Sonar Scanner        Send project analysis to SonarQube
  Trivy                Filesystem and Docker image vulnerability scanning
  curl                 Application testing
  Docker Hub account   Store Docker images

------------------------------------------------------------------------

# 5. Install Git

## Ubuntu/Debian

``` bash
sudo apt update
sudo apt install git -y
```

Verify:

``` bash
git --version
```

Official documentation:

https://git-scm.com/install/

------------------------------------------------------------------------

# 6. Install Java

Current Jenkins Linux documentation requires Java 21 or later.

For Ubuntu/Debian:

``` bash
sudo apt update
sudo apt install fontconfig openjdk-21-jre -y
```

Verify:

``` bash
java -version
```

Official Jenkins documentation:

https://www.jenkins.io/doc/book/installing/linux/

------------------------------------------------------------------------

# 7. Install Jenkins

Follow the official Jenkins installation instructions for your operating
system.

For Ubuntu/Debian, use the official Jenkins package repository
instructions rather than an unofficial package.

Official documentation:

https://www.jenkins.io/doc/book/installing/linux/

After installation:

``` bash
sudo systemctl enable jenkins
sudo systemctl start jenkins
sudo systemctl status jenkins
```

Jenkins normally listens on:

``` text
http://YOUR-SERVER-IP:8080
```

If using AWS EC2, allow TCP port `8080` in the EC2 security group if
Jenkins needs to be accessed externally.

------------------------------------------------------------------------

# 8. Install Docker Engine

For Ubuntu, follow Docker's official Docker Engine installation guide.

Official documentation:

https://docs.docker.com/engine/install/ubuntu/

After installation:

``` bash
docker --version
```

Test Docker:

``` bash
sudo docker run hello-world
```

Enable Docker at boot:

``` bash
sudo systemctl enable docker
sudo systemctl start docker
```

------------------------------------------------------------------------

# 9. Give Jenkins Permission to Use Docker

Jenkins runs under the `jenkins` Linux user.

Add Jenkins to the Docker group:

``` bash
sudo usermod -aG docker jenkins
```

Restart Jenkins:

``` bash
sudo systemctl restart jenkins
```

Test:

``` bash
sudo -u jenkins docker ps
```

This command must work without a Docker permission error.

If Jenkins still cannot access Docker, log out/restart the server if
necessary and verify again.

------------------------------------------------------------------------

# 10. Install Docker Compose V2

The pipeline uses:

``` bash
docker compose
```

not the legacy:

``` bash
docker-compose
```

For Ubuntu/Debian, install the Docker Compose plugin:

``` bash
sudo apt update
sudo apt install docker-compose-plugin -y
```

Verify:

``` bash
docker compose version
```

Also test it as Jenkins:

``` bash
sudo -u jenkins docker compose version
```

Both commands should work.

Official Docker Compose documentation:

https://docs.docker.com/compose/install/linux/

Official overview:

https://docs.docker.com/compose/install/

------------------------------------------------------------------------

# 11. Install Gitleaks

Gitleaks scans the repository for secrets such as:

-   passwords
-   API keys
-   access tokens
-   private keys
-   credentials

Official project:

https://github.com/gitleaks/gitleaks

Official releases:

https://github.com/gitleaks/gitleaks/releases

After installation, verify:

``` bash
gitleaks version
```

The Jenkins pipeline uses:

``` bash
gitleaks detect --source ./client --exit-code 1
gitleaks detect --source ./api --exit-code 1
```

If Gitleaks finds a secret, the corresponding stage fails.

------------------------------------------------------------------------

# 12. Install Trivy

Trivy is used in this project for:

1.  Filesystem scanning
2.  Backend Docker image scanning
3.  Frontend Docker image scanning

Official installation documentation:

https://trivy.dev/docs/latest/getting-started/installation/

For Ubuntu/Debian, follow the official repository installation
instructions.

Verify:

``` bash
trivy --version
```

Example pipeline commands:

``` bash
trivy fs --format table -o fs-report.html .
```

and:

``` bash
trivy image --format table -o backend-image-report.html mruday033/backend:latest
```

------------------------------------------------------------------------

# 13. Install SonarQube Server

SonarQube is used for static code analysis.

Official SonarQube Server installation documentation:

https://docs.sonarsource.com/sonarqube-server/server-installation/

Docker installation documentation:

https://docs.sonarsource.com/sonarqube-server/server-installation/from-docker-image/

For a Docker-based setup, SonarQube normally exposes port:

``` text
9000
```

After SonarQube starts, open:

``` text
http://YOUR-SERVER-IP:9000
```

Use the SonarQube documentation for the current database, Docker image,
and server configuration requirements.

For a persistent Docker deployment, SonarQube documents persistent
volumes for data, logs, and extensions.

------------------------------------------------------------------------

# 14. Configure SonarQube

After SonarQube is running:

1.  Log in to SonarQube.
2.  Create/configure the project.
3.  Generate an authentication token.
4.  Keep the token private.
5.  Add the token to Jenkins credentials.

The Jenkins pipeline expects:

``` text
Credential ID: sonar-token
```

The Jenkinsfile uses:

``` groovy
withSonarQubeEnv('sonar')
```

Therefore Jenkins must have a SonarQube server configuration named:

``` text
sonar
```

Configure this under:

``` text
Jenkins
→ Manage Jenkins
→ System
→ SonarQube servers
```

------------------------------------------------------------------------

# 15. Jenkins Plugins

Install the plugins required by the Jenkinsfile.

Recommended plugins:

-   Pipeline
-   Git
-   NodeJS
-   Docker Pipeline
-   Credentials Binding
-   SonarQube Scanner for Jenkins
-   Pipeline Stage View

Go to:

``` text
Jenkins
→ Manage Jenkins
→ Plugins
```

Search for the required plugins and install them.

Jenkins Pipeline documentation:

https://www.jenkins.io/doc/book/pipeline/

Jenkins Docker Pipeline documentation:

https://www.jenkins.io/doc/book/pipeline/docker/

------------------------------------------------------------------------

# 16. Configure Node.js in Jenkins

The current Jenkinsfile uses a Node.js tool named:

``` text
nodejs123
```

Configure it here:

``` text
Jenkins
→ Manage Jenkins
→ Tools
→ NodeJS installations
```

Set:

``` text
Name: nodejs123
```

Install a Node.js version compatible with the project.

Verify from a Jenkins pipeline or Jenkins environment:

``` bash
node --version
npm --version
```

Important:

The name in Jenkins and the name in the Jenkinsfile must match exactly.

For example:

``` groovy
tools {
    nodejs 'nodejs123'
}
```

If Jenkins has `nodejs23` instead, either rename the Jenkins tool or
change the Jenkinsfile.

------------------------------------------------------------------------

# 17. Configure SonarQube Scanner in Jenkins

Go to:

``` text
Jenkins
→ Manage Jenkins
→ Tools
→ SonarQube Scanner installations
```

Create:

``` text
Name: sonar-scanner
```

The Jenkinsfile expects:

``` groovy
environment {
    SCANNER_HOME = tool 'sonar-scanner'
}
```

Therefore the name must match exactly.

------------------------------------------------------------------------

# 18. Create Jenkins Credentials

## 18.1 Docker Hub Credential

Go to:

``` text
Jenkins
→ Manage Jenkins
→ Credentials
→ System
→ Global credentials
→ Add Credentials
```

Use:

``` text
Kind: Username with password

Username:
YOUR_DOCKER_HUB_USERNAME

Password:
YOUR_DOCKER_HUB_ACCESS_TOKEN

ID:
docker-cred
```

Use a Docker Hub access token rather than putting a Docker Hub password
inside the Jenkinsfile.

The pipeline expects:

``` groovy
credentialsId: 'docker-cred'
```

------------------------------------------------------------------------

# 18.2 SonarQube Credential

Create:

``` text
Kind: Secret text

Secret:
YOUR_SONARQUBE_TOKEN

ID:
sonar-token
```

The Jenkinsfile expects:

``` groovy
credentialsId: 'sonar-token'
```

------------------------------------------------------------------------

# 18.3 GitHub Credential

The repository is currently public:

``` text
https://github.com/Uday-Kumar033/Project-DevSecOps-3Tier
```

For a public repository, Jenkins can normally clone it without a GitHub
credential.

If you make the repository private, create:

``` text
Kind: Username with password

Username:
YOUR_GITHUB_USERNAME

Password:
YOUR_GITHUB_PERSONAL_ACCESS_TOKEN

ID:
github-cred
```

Then use:

``` groovy
git(
    branch: 'main',
    credentialsId: 'github-cred',
    url: 'https://github.com/Uday-Kumar033/Project-DevSecOps-3Tier.git'
)
```

Never commit GitHub tokens to the repository.

------------------------------------------------------------------------

# 19. Verify All Tools Before Running Jenkins

Run these commands on the Jenkins machine:

``` bash
git --version
java -version
node --version
npm --version
docker --version
docker compose version
gitleaks version
trivy --version
curl --version
```

Then test Docker as Jenkins:

``` bash
sudo -u jenkins docker --version
sudo -u jenkins docker compose version
sudo -u jenkins docker ps
```

All required commands should work.

------------------------------------------------------------------------

# 20. Clone the Project Manually for the First Test

Before debugging Jenkins, verify that the project itself works.

``` bash
git clone https://github.com/Uday-Kumar033/Project-DevSecOps-3Tier.git
cd Project-DevSecOps-3Tier
```

Check:

``` bash
ls
```

Expected project areas include:

``` text
api/
client/
docker-compose.yaml
```

Start the application:

``` bash
docker compose up -d --build
```

Check:

``` bash
docker compose ps
```

Test the frontend:

``` bash
curl -f http://localhost:3000
```

View logs:

``` bash
docker compose logs --tail=100
```

Stop the test deployment:

``` bash
docker compose down --remove-orphans
```

------------------------------------------------------------------------

# 21. Add the Jenkinsfile

Create this file in the root of the repository:

``` text
Project-DevSecOps-3Tier/
├── api/
├── client/
├── mysql-init/
├── docker-compose.yaml
├── Jenkinsfile
└── README.md
```

The Jenkinsfile should be committed to GitHub.

``` bash
git add Jenkinsfile README.md
git commit -m "Add DevSecOps Jenkins CI/CD pipeline"
git push origin main
```

------------------------------------------------------------------------

# 22. Create Jenkins Pipeline Job

Open Jenkins.

Select:

``` text
New Item
```

Enter:

``` text
Name:
ci
```

Select:

``` text
Pipeline
```

Click:

``` text
OK
```

Under Pipeline configuration, select:

``` text
Definition:
Pipeline script from SCM
```

Select:

``` text
SCM:
Git
```

Repository URL:

``` text
https://github.com/Uday-Kumar033/Project-DevSecOps-3Tier.git
```

Branch:

``` text
*/main
```

Script Path:

``` text
Jenkinsfile
```

If the repository is private, select the `github-cred` credential.

Click:

``` text
Save
```

------------------------------------------------------------------------

# 23. Run the Pipeline

From the Jenkins job:

``` text
ci
→ Build Now
```

Jenkins will execute:

``` text
Git Checkout
      ↓
Frontend Compilation
      ↓
Backend Compilation
      ↓
Gitleaks
      ↓
SonarQube
      ↓
Quality Gate
      ↓
Trivy FS
      ↓
Backend Docker Build
      ↓
Backend Trivy Scan
      ↓
Frontend Docker Build
      ↓
Frontend Trivy Scan
      ↓
Docker Compose Build
      ↓
Docker Compose Start
      ↓
Application Test
      ↓
Application Logs
      ↓
Docker Compose Test Cleanup
      ↓
Docker Hub Push
      ↓
Final Deployment
```

------------------------------------------------------------------------

# 24. Docker Compose Test Behavior

The CI test environment is intentionally temporary.

The pipeline does:

``` bash
docker compose build
```

then:

``` bash
docker compose up -d
```

then:

``` bash
curl -f http://localhost:3000
```

then:

``` bash
docker compose logs --tail=100
```

then:

``` bash
docker compose down --remove-orphans
```

Therefore the containers used for the CI test are removed before the
final deployment.

After that, the final deployment runs:

``` bash
docker compose up -d
```

The application remains running after the pipeline completes.

------------------------------------------------------------------------

# 25. Docker Images

The pipeline builds:

``` text
mruday033/backend:latest
mruday033/frontend:latest
```

Then scans them using Trivy.

After successful testing, Jenkins pushes them to Docker Hub:

``` bash
docker push mruday033/backend:latest
docker push mruday033/frontend:latest
```

------------------------------------------------------------------------

# 26. Where Docker Images Are Stored

After:

``` bash
docker build
```

the images initially exist on the Jenkins machine's local Docker image
store.

For example:

``` bash
docker images
```

After:

``` bash
docker push mruday033/backend:latest
```

the image is stored in Docker Hub under:

``` text
mruday033/backend
```

Similarly:

``` text
mruday033/frontend
```

------------------------------------------------------------------------

# 27. Useful Jenkins Troubleshooting Commands

## Check Jenkins

``` bash
sudo systemctl status jenkins
```

Logs:

``` bash
sudo journalctl -u jenkins -f
```

## Check Docker

``` bash
sudo systemctl status docker
docker ps
```

## Check Docker Compose

``` bash
docker compose version
```

## Check Jenkins Docker permission

``` bash
sudo -u jenkins docker ps
```

## Check Compose as Jenkins

``` bash
sudo -u jenkins docker compose version
```

## Check running application

``` bash
docker compose ps
```

## View application logs

``` bash
docker compose logs --tail=100
```

## Stop application

``` bash
docker compose down --remove-orphans
```

------------------------------------------------------------------------

# 28. Common Jenkins Errors

## Error: Node.js installation not found

Example:

``` text
Tool type "nodejs" does not have an install of "nodejs23" configured
```

Check:

``` text
Jenkins
→ Manage Jenkins
→ Tools
→ NodeJS installations
```

The name must exactly match the Jenkinsfile.

Current project configuration:

``` groovy
tools {
    nodejs 'nodejs123'
}
```

------------------------------------------------------------------------

## Error: `docker compose` unknown command

Example:

``` text
docker: unknown command: docker compose
```

Install Docker Compose V2:

``` bash
sudo apt update
sudo apt install docker-compose-plugin -y
```

Verify:

``` bash
docker compose version
```

Then verify as Jenkins:

``` bash
sudo -u jenkins docker compose version
```

Do not mix the old `docker-compose` command with the V2 `docker compose`
command unless the pipeline has explicitly been written for the legacy
version.

------------------------------------------------------------------------

## Error: Docker permission denied

Run:

``` bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

Then:

``` bash
sudo -u jenkins docker ps
```

------------------------------------------------------------------------

## Error: Gitleaks command not found

Check:

``` bash
which gitleaks
gitleaks version
```

If Jenkins cannot find it, make sure the binary is installed in a
directory available in the Jenkins service PATH.

------------------------------------------------------------------------

## Error: Trivy command not found

Check:

``` bash
which trivy
trivy --version
```

Make sure Trivy is installed on the Jenkins agent and available in its
PATH.

------------------------------------------------------------------------

## Error: SonarQube connection failure

Check:

``` text
Jenkins
→ Manage Jenkins
→ System
→ SonarQube servers
```

The server name must match:

``` text
sonar
```

The scanner installation must match:

``` text
sonar-scanner
```

The Jenkins credential must match:

``` text
sonar-token
```



------------------------------------------------------------------------




# 32. Official Documentation References

## Git

https://git-scm.com/install/

## Docker Engine

https://docs.docker.com/engine/install/

## Docker Engine on Ubuntu

https://docs.docker.com/engine/install/ubuntu/

## Docker Compose

https://docs.docker.com/compose/install/

## Docker Compose on Linux

https://docs.docker.com/compose/install/linux/

## Jenkins on Linux

https://www.jenkins.io/doc/book/installing/linux/

## Jenkins Pipeline

https://www.jenkins.io/doc/book/pipeline/

## Jenkins + Docker

https://www.jenkins.io/doc/book/pipeline/docker/

## Gitleaks

https://github.com/gitleaks/gitleaks

## Gitleaks Releases

https://github.com/gitleaks/gitleaks/releases

## SonarQube Server Installation

https://docs.sonarsource.com/sonarqube-server/server-installation/

## SonarQube with Docker

https://docs.sonarsource.com/sonarqube-server/server-installation/from-docker-image/

## Trivy Installation

https://trivy.dev/docs/latest/getting-started/installation/

------------------------------------------------------------------------



This project demonstrates a complete DevSecOps workflow from source-code
checkout through security validation, containerization, automated
testing, image publishing, and deployment.
