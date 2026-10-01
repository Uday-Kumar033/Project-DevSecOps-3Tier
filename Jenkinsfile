pipeline {
    agent any

    tools {
        nodejs 'nodejs23'
    }

    environment {
        SCANNER_HOME = tool 'sonar-scanner'

        DOCKERHUB_USER = 'mruday033'

        BACKEND_IMAGE = "${DOCKERHUB_USER}/backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/frontend"
    }

    stages {

        // =========================================================
        // 1. CHECKOUT
        // =========================================================

        stage('Git Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Uday-Kumar033/Project-DevSecOps-3Tier.git'
            }
        }

        // =========================================================
        // 2. FRONTEND COMPILATION
        // =========================================================

        stage('Frontend Compilation') {
            steps {
                dir('client') {
                    sh '''
                        echo "Checking frontend JavaScript files..."
                        find src -name "*.js" -exec node --check {} +
                    '''
                }
            }
        }

        // =========================================================
        // 3. BACKEND COMPILATION
        // =========================================================

        stage('Backend Compilation') {
            steps {
                dir('api') {
                    sh '''
                        echo "Checking backend JavaScript files..."
                        find . -name "*.js" -exec node --check {} +
                    '''
                }
            }
        }

        // =========================================================
        // 4. GITLEAKS
        // =========================================================

        stage('GitLeaks Scan') {
            steps {
                sh '''
                    echo "Running Gitleaks..."

                    gitleaks detect \
                        --source ./client \
                        --exit-code 1

                    gitleaks detect \
                        --source ./api \
                        --exit-code 1
                '''
            }
        }

        // =========================================================
        // 5. SONARQUBE
        // =========================================================

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar') {

                    sh '''
                        $SCANNER_HOME/bin/sonar-scanner \
                            -Dsonar.projectName=Uday-3Tier-DevSecOps \
                            -Dsonar.projectKey=Uday-3Tier-DevSecOps \
                            -Dsonar.sources=api,client
                    '''
                }
            }
        }

        // =========================================================
        // 6. QUALITY GATE
        // =========================================================

        stage('Quality Gate Check') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {

                    waitForQualityGate(
                        abortPipeline: true,
                        credentialsId: 'sonar-token'
                    )
                }
            }
        }

        // =========================================================
        // 7. TRIVY FILESYSTEM SCAN
        // =========================================================

        stage('Trivy Filesystem Scan') {
            steps {
                sh '''
                    echo "Running Trivy filesystem scan..."

                    trivy fs \
                        --format table \
                        -o fs-report.html \
                        .
                '''
            }
        }

        // =========================================================
        // 8. BUILD BACKEND IMAGE
        // =========================================================

        stage('Build Backend Docker Image') {
            steps {
                sh '''
                    echo "Building backend Docker image..."

                    docker build \
                        -t ${BACKEND_IMAGE}:latest \
                        ./api
                '''
            }
        }

        // =========================================================
        // 9. SCAN BACKEND IMAGE
        // =========================================================

        stage('Trivy Backend Image Scan') {
            steps {
                sh '''
                    echo "Scanning backend Docker image..."

                    trivy image \
                        --format table \
                        -o backend-image-report.html \
                        ${BACKEND_IMAGE}:latest
                '''
            }
        }

        // =========================================================
        // 10. BUILD FRONTEND IMAGE
        // =========================================================

        stage('Build Frontend Docker Image') {
            steps {
                sh '''
                    echo "Building frontend Docker image..."

                    docker build \
                        -t ${FRONTEND_IMAGE}:latest \
                        ./client
                '''
            }
        }

        // =========================================================
        // 11. SCAN FRONTEND IMAGE
        // =========================================================

        stage('Trivy Frontend Image Scan') {
            steps {
                sh '''
                    echo "Scanning frontend Docker image..."

                    trivy image \
                        --format table \
                        -o frontend-image-report.html \
                        ${FRONTEND_IMAGE}:latest
                '''
            }
        }

        // =========================================================
        // 12. DOCKER COMPOSE BUILD
        // =========================================================

        stage('Docker Compose Build') {
            steps {
                sh '''
                    echo "Stopping previous Compose deployment..."

                    docker compose down --remove-orphans || true

                    echo "Building application using Docker Compose..."

                    docker compose build
                '''
            }
        }

        // =========================================================
        // 13. DOCKER COMPOSE START
        // =========================================================

        stage('Docker Compose Start') {
            steps {
                sh '''
                    echo "Starting application..."

                    docker compose up -d

                    echo "Waiting for containers..."

                    sleep 20

                    docker compose ps
                '''
            }
        }

        // =========================================================
        // 14. APPLICATION TEST
        // =========================================================

        stage('Application Test') {
            steps {
                sh '''
                    echo "Testing frontend..."

                    curl -f http://localhost:3000

                    echo ""
                    echo "Testing backend container..."

                    docker compose ps backend

                    echo ""
                    echo "Application test completed."
                '''
            }
        }

        // =========================================================
        // 15. SHOW APPLICATION LOGS
        // =========================================================

        stage('Application Logs') {
            steps {
                sh '''
                    echo "========== DOCKER COMPOSE STATUS =========="

                    docker compose ps

                    echo ""
                    echo "========== APPLICATION LOGS =========="

                    docker compose logs --tail=100
                '''
            }
        }

        // =========================================================
        // 16. PUSH BACKEND IMAGE
        // =========================================================

        stage('Push Backend Docker Image') {
            steps {
                withDockerRegistry(
                    credentialsId: 'docker-cred',
                    url: 'https://index.docker.io/v1/'
                ) {

                    sh '''
                        echo "Pushing backend image..."

                        docker push ${BACKEND_IMAGE}:latest
                    '''
                }
            }
        }

        // =========================================================
        // 17. PUSH FRONTEND IMAGE
        // =========================================================

        stage('Push Frontend Docker Image') {
            steps {
                withDockerRegistry(
                    credentialsId: 'docker-cred',
                    url: 'https://index.docker.io/v1/'
                ) {

                    sh '''
                        echo "Pushing frontend image..."

                        docker push ${FRONTEND_IMAGE}:latest
                    '''
                }
            }
        }

        // =========================================================
        // 18. FINAL DEPLOYMENT
        // =========================================================

        stage('Deploy with Docker Compose') {
            steps {
                sh '''
                    echo "Deploying application..."

                    docker compose down --remove-orphans || true

                    docker compose up -d

                    sleep 15

                    docker compose ps
                '''
            }
        }
    }

    // =============================================================
    // POST ACTIONS
    // =============================================================

    post {

        always {
            echo '========================================='
            echo ' Jenkins Pipeline Finished'
            echo '========================================='

            sh '''
                docker compose ps || true
            '''
        }

        success {
            echo '========================================='
            echo ' BUILD SUCCESSFUL'
            echo ' Application deployed successfully'
            echo '========================================='
        }

        failure {
            echo '========================================='
            echo ' BUILD FAILED'
            echo ' Check Jenkins Console Output'
            echo '========================================='

            sh '''
                docker compose ps || true
                docker compose logs --tail=100 || true
            '''
        }
    }
}
