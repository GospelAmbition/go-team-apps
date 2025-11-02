# Install B2 CLI if needed
pip install b2

# Authorize (updated command)
b2 account authorize

# Update bucket with CORS rules

b2 bucket update --cors-rules '[{"corsRuleName":"allowS3Uploads","allowedOrigins":["https://domain.com"],"allowedHeaders":["*"],"allowedOperations":["s3_put","s3_get","s3_head"],"exposeHeaders":["ETag"],"maxAgeSeconds":3600}]' bucket-name allPrivate