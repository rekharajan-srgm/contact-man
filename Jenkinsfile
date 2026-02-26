pipeline {
    agent any

    environment {
        CI      = 'true'             // Playwright: retry on CI, always start fresh server
        NVM_DIR = "${env.HOME}/.nvm" // nvm installation directory
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 15, unit: 'MINUTES')
    }

    stages {

        stage('Checkout') {
            steps {
                git url: 'https://github.com/rekharajan-srgm/contact-man.git',
                    branch: 'main'
            }
        }

        // ──────────────────────────────────────────────
        // Node.js setup via nvm (no NodeJS plugin needed)
        // ──────────────────────────────────────────────
        stage('Setup Node.js') {
            steps {
                sh '''
                    # Install nvm if not already present
                    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                    fi
                    . $NVM_DIR/nvm.sh
                    nvm install 18
                    nvm alias default 18
                    node --version
                    npm --version
                '''
            }
        }

        // ──────────────────────────────────────────────
        // Angular application
        // ──────────────────────────────────────────────
        stage('Install App Dependencies') {
            steps {
                dir('app') {
                    sh '. $NVM_DIR/nvm.sh && npm ci'
                }
            }
        }

        stage('Build Angular App') {
            steps {
                dir('app') {
                    sh '. $NVM_DIR/nvm.sh && npm run build'
                }
            }
        }

        // ──────────────────────────────────────────────
        // Playwright tests
        // ──────────────────────────────────────────────
        stage('Install Playwright Dependencies') {
            steps {
                dir('playwright-tests') {
                    sh '. $NVM_DIR/nvm.sh && npm ci'
                    // Install Chromium + its OS-level deps in one shot
                    sh '. $NVM_DIR/nvm.sh && npx playwright install --with-deps chromium'
                }
            }
        }

        stage('Run Playwright Tests') {
            steps {
                dir('playwright-tests') {
                    // playwright.config.js webServer block auto-starts Angular on port 4200
                    sh '. $NVM_DIR/nvm.sh && npm test'
                }
            }
        }
    }

    post {
        always {
            // Publish the HTML report (requires the "HTML Publisher" Jenkins plugin)
            publishHTML(target: [
                allowMissing         : true,
                alwaysLinkToLastBuild: true,
                keepAll              : true,
                reportDir            : 'playwright-tests/playwright-report',
                reportFiles          : 'index.html',
                reportName           : 'Playwright Report'
            ])

            // Archive test artifacts so they survive workspace cleanup
            archiveArtifacts artifacts: 'playwright-tests/playwright-report/**',
                             allowEmptyArchive: true

            archiveArtifacts artifacts: 'playwright-tests/test-results/**',
                             allowEmptyArchive: true
        }

        failure {
            echo '❌ Pipeline failed – check the Playwright Report above for screenshots/videos.'
        }

        success {
            echo '✅ All Playwright tests passed!'
        }
    }
}
