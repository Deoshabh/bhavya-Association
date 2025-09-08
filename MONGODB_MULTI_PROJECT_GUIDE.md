# MongoDB Multi-Project Setup Guide

## Your VPS MongoDB Configuration

Based on your Dokploy setup, you have a centralized MongoDB instance that can be shared across multiple projects.

### MongoDB Connection Details

- **Host**: `mongo-db-mongo-db-yc5kum`
- **Port**: `27017`
- **Username**: `mongo`
- **Password**: `DevSum@12345`
- **Base Connection**: `mongodb://mongo:DevSum@12345@mongo-db-mongo-db-yc5kum:27017`

## Project Database Separation

Each project should use a different database name to keep data isolated:

### BHAVYA Association Project

```env
MONGODB_URI=mongodb://mongo:DevSum@12345@mongo-db-mongo-db-yc5kum:27017/bhavya
```

### Other Project Examples

```env
# E-commerce project
MONGODB_URI=mongodb://mongo:DevSum@12345@mongo-db-mongo-db-yc5kum:27017/ecommerce

# Blog project
MONGODB_URI=mongodb://mongo:DevSum@12345@mongo-db-mongo-db-yc5kum:27017/blog

# CRM project
MONGODB_URI=mongodb://mongo:DevSum@12345@mongo-db-mongo-db-yc5kum:27017/crm
```

## Database Management

### Connecting to MongoDB

If you need to access MongoDB directly:

```bash
# Using Docker exec to access MongoDB shell
docker exec -it mongo-db-mongo-db-yc5kum mongosh

# Or with authentication
docker exec -it mongo-db-mongo-db-yc5kum mongosh -u mongo -p 'DevSum@12345'
```

### Common MongoDB Commands

```javascript
// List all databases
show dbs

// Switch to specific project database
use bhavya

// List collections in current database
show collections

// View database stats
db.stats()

// Create user for specific database (if needed)
db.createUser({
  user: "bhavya_user",
  pwd: "secure_password",
  roles: [{ role: "readWrite", db: "bhavya" }]
})
```

## Project Deployment Workflow

### 1. For Each New Project:

1. Choose a unique database name
2. Update the project's MONGODB_URI environment variable
3. Deploy the project - MongoDB will automatically create the database
4. Verify connection in application logs

### 2. Database Isolation Benefits:

- **Security**: Each project has its own data space
- **Backup**: Can backup individual project databases
- **Development**: Can have separate staging databases
- **Migration**: Easy to move individual projects

### 3. Monitoring Multiple Projects:

```bash
# Check all databases
docker exec -it mongo-db-mongo-db-yc5kum mongosh -u mongo -p 'DevSum@12345' --eval "show dbs"

# Check connections
docker exec -it mongo-db-mongo-db-yc5kum mongosh -u mongo -p 'DevSum@12345' --eval "db.serverStatus().connections"
```

## Environment Variable Templates

### For New Projects - Copy and modify:

```env
# Application Settings
NODE_ENV=production
PORT=5000

# MongoDB - Change database name for each project
MONGODB_URI=mongodb://mongo:DevSum@12345@mongo-db-mongo-db-yc5kum:27017/YOUR_PROJECT_DB_NAME

# Authentication - Use unique JWT secret per project
JWT_SECRET=your-unique-jwt-secret-for-this-project

# CORS Origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Backup Strategy

### Individual Database Backup:

```bash
# Backup specific project database
docker exec mongo-db-mongo-db-yc5kum mongodump --username mongo --password 'DevSum@12345' --db bhavya --out /backup/

# Restore specific project database
docker exec mongo-db-mongo-db-yc5kum mongorestore --username mongo --password 'DevSum@12345' --db bhavya /backup/bhavya/
```

## Security Considerations

1. **Unique JWT Secrets**: Each project should have its own JWT secret
2. **Database Isolation**: Never share database names between projects
3. **Access Control**: Consider creating specific users for each project database
4. **Regular Backups**: Backup each project database separately

## Troubleshooting

### Connection Issues:

1. Verify MongoDB container is running
2. Check network connectivity between containers
3. Validate credentials and database name
4. Review application logs for specific error messages

### Performance Monitoring:

```bash
# Monitor active connections
docker exec mongo-db-mongo-db-yc5kum mongosh -u mongo -p 'DevSum@12345' --eval "db.serverStatus().connections"

# Check database sizes
docker exec mongo-db-mongo-db-yc5kum mongosh -u mongo -p 'DevSum@12345' --eval "db.adminCommand('listCollections').cursor.firstBatch.forEach(c => print(c.name + ': ' + db.getCollection(c.name).stats().size))"
```
