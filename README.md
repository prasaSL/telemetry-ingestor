# 🚀 Telemetry Ingestor Service

This project is a **NestJS-based Telemetry Ingestor API** designed to receive, store, and test IoT telemetry data using webhooks.
It demonstrates RESTful API creation, MongoDB Atlas integration, and unit testing with Jest.

---

## 🧬 Features
* REST API endpoints for telemetry ingestion
* MongoDB Atlas database connection for storing telemetry data
* Webhook integration using [Webhook.site](https://webhook.site)
* Unit tests using Jest
* Modular NestJS structure (Controller, Service, Schema)

---

## ⚙️ Setup Instructions

### 1️⃣  unZip file



### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Create `.env` File

If you are using **MongoDB Atlas**, add your connection string:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/telemetry
PORT=3000
```


If not using Atlas, you can run MongoDB locally and update the URI accordingly.

### 4️⃣ Run the Application

```bash
npm run start:dev
```

This will start your NestJS server at
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🌐 Webhook.site URL

During testing, all incoming telemetry POST requests were sent to:

**Webhook URL:**

```
https://webhook.site/your-unique-id
```

*(Alternatively, include a screenshot or your request ID if required by your instructor.)*

Example Request:

```bash
curl -X POST https://webhook.site/your-unique-id \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "sensor-01", "temperature": 27.3, "humidity": 61}'
```

---

## 🧠 MongoDB Atlas Connection Note

This project uses **MongoDB Atlas** for cloud data storage.
The connection string is securely stored in the `.env` file and imported in `app.module.ts` as:

```ts
MongooseModule.forRoot(process.env.MONGO_URI)
```

If Atlas is unavailable, switch to a local MongoDB server by updating the URI.

---

## 🧪 Running Tests

Run all unit tests:

```bash
npm run test
```

Run with watch mode:

```bash
npm run test:watch
```

Run with coverage report:

```bash
npm run test:cov
```

Example Output:

```
 PASS  src/telemetry/telemetry.controller.spec.ts
 PASS  src/telemetry/telemetry.service.spec.ts
 PASS  src/health/health.controller.spec.ts
 PASS  src/app.controller.spec.ts

Test Suites: 4 passed, 4 total
Tests:       4 passed, 4 total
```

---

## 🤖 AI Assistance Summary

AI tools (e.g., ChatGPT) were used for:

* Structuring the NestJS project (modules, controllers, and schemas)
* Generating initial unit test templates with Jest
* Writing the MongoDB schema and connection logic
* Creating the Webhook integration and test examples
* Drafting this README file structure and documentation format
* documenting readme.md 

---

## 📁 Project Structure

```
src/
 ├── app.controller.ts
 ├── app.module.ts
 ├── telemetry/
 │   ├── telemetry.controller.ts
 │   ├── telemetry.service.ts
 │   └── telemetry.schema.ts
 ├── health/
 │   ├── health.controller.ts
 └── main.ts
```

---

## 📜 License

MIT License © 2025 Prasad Madushan
