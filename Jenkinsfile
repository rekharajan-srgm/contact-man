pipeline {
    agent any

    tools {
        nodejs 'NodeJS-18'   // Must match the NodeJS installation name in Jenkins → Global Tool Configuration
    }

    environment {
        CI = 'true'          // Tells Playwright to retry on failure (retries: 2) and not reuse existing server
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
        // Angular application
        // ──────────────────────────────────────────────
        stage('Install App Dependencies') {
            steps {
                dir('app') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build Angular App') {
            steps {
                dir('app') {
                    sh 'npm run build'
                }
            }
        }

        // ──────────────────────────────────────────────
        // Playwright tests
        // ──────────────────────────────────────────────
        stage('Install Playwright Dependencies') {
            steps {
                dir('playwright-tests') {
                    sh 'npm ci'
                    // Install Chromium + its OS-level deps in one shot
                    sh 'npx playwright install --with-deps chromium'
                }
            }
        }

        stage('Run Playwright Tests') {
            steps {
                dir('playwright-tests') {
                    // playwright.config.js already contains a webServer block that
                    // starts "npm start --prefix ../app" on port 4200 and waits for
                    // it to be ready before executing the tests.
                    sh 'npm test'
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
