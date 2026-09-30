# AI MatEsti API Documentation

Base URL: `http://localhost:8000/api`
Swagger: `http://localhost:8000/docs`

## Authentication

### POST /api/auth/login
```json
Request: { "email": "demo@aimatesti.com", "password": "demo1234" }
Response: { "access_token": "...", "token_type": "bearer", "user": {...} }
```

## Projects

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/projects         | List all projects    |
| POST   | /api/projects         | Create project       |
| GET    | /api/projects/{id}    | Get project          |
| PUT    | /api/projects/{id}    | Update project       |
| DELETE | /api/projects/{id}    | Delete project       |
| GET    | /api/projects/stats   | Project statistics   |

## Drawings

| Method | Endpoint                        | Description          |
|--------|---------------------------------|----------------------|
| POST   | /api/drawings/upload            | Upload drawing file  |
| GET    | /api/drawings/{project_id}      | Get project drawings |
| POST   | /api/drawings/{id}/analyze      | Analyze drawing      |

## Materials

| Method | Endpoint                | Description        |
|--------|-------------------------|--------------------|
| GET    | /api/materials          | List materials     |
| POST   | /api/materials          | Create material    |
| PUT    | /api/materials/{id}     | Update material    |
| DELETE | /api/materials/{id}     | Delete material    |
| GET    | /api/materials/categories | Get categories   |

## Estimation

| Method | Endpoint                          | Description           |
|--------|-----------------------------------|-----------------------|
| POST   | /api/estimation/calculate         | Calculate estimation  |
| GET    | /api/estimation/project/{id}      | Get estimations       |
| GET    | /api/estimation/cost/{id}         | Get cost breakdown    |
| PUT    | /api/estimation/{id}              | Update estimation     |
| DELETE | /api/estimation/{id}              | Delete estimation     |

## BOQ

| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| POST   | /api/boq/generate         | Generate BOQ         |
| GET    | /api/boq/project/{id}     | Get BOQ items        |
| POST   | /api/boq/item             | Add BOQ item         |
| PUT    | /api/boq/{id}             | Update BOQ item      |
| DELETE | /api/boq/{id}             | Delete BOQ item      |

## Reports

| Method | Endpoint                      | Description         |
|--------|-------------------------------|---------------------|
| POST   | /api/reports/generate         | Generate report     |
| GET    | /api/reports/project/{id}     | Get project reports |
| GET    | /api/reports/{id}             | Get report          |
