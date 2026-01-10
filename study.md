## 1. Python Engineering (Level 3 - Expert)

### Core Python

- [ ] Advanced OOP: metaclasses, descriptors, context managers, decorators
- [ ] Concurrency: asyncio, threading, multiprocessing, GIL implications
- [ ] Memory management: garbage collection, weak references, profiling
- [ ] Type hints and mypy for large codebases
- [ ] Performance optimization: cProfile, line_profiler, memory_profiler

### Software Engineering Best Practices

- [ ] Design patterns: Factory, Strategy, Observer, Singleton (when to avoid)
- [ ] SOLID principles in practice
- [ ] Testing: pytest, unittest, mocking, fixtures, parametrized tests
- [ ] Code quality: pylint, black, isort, pre-commit hooks
- [ ] Documentation: docstrings, type hints, Sphinx

### Python Ecosystem

- [ ] Virtual environments: venv, conda, poetry
- [ ] Package management and distribution: setuptools, pip, wheel
- [ ] Common libraries mastery: requests, click, pydantic, dataclasses
- [ ] Debugging: pdb, ipdb, debugging production issues

**Evidence from job postings:** 78% of data science postings explicitly require Python; NumPy, Pandas appear in nearly all DE/ML roles

---

## 2. Data Engineering (Level 2.5 - Moderate-Advanced)

### SQL & Databases (Critical - appears in vast majority of postings)

- [ ] Advanced SQL: window functions, CTEs, query optimization, execution plans
  - [ ] Understand EXPLAIN/EXPLAIN ANALYZE for query performance
  - [ ] Indexing strategies: when to use B-tree, hash, composite indexes
  - [ ] Partitioning vs sharding: trade-offs and use cases
- [ ] NoSQL databases: document stores (MongoDB), wide-column (Cassandra), key-value (Redis)
  - [ ] When to use NoSQL vs SQL
  - [ ] CAP theorem implications for database choice
- [ ] Data warehouses: architecture patterns, columnar storage, MPP (massively parallel processing)
  - [ ] Understanding fact and dimension tables
  - [ ] Slowly changing dimensions (SCD) types
- [ ] Data modeling: star schema, snowflake schema, dimensional modeling, normalization vs denormalization
- [ ] Database performance: query tuning, connection pooling, caching strategies

### Data Pipeline & ETL/ELT Concepts

- [ ] **ETL vs ELT paradigms**: when to transform before vs after loading
  - [ ] ETL: transform in staging area before loading (traditional)
  - [ ] ELT: load raw data first, transform in destination (modern cloud approach)
  - [ ] Trade-offs: processing power location, data freshness, flexibility
- [ ] **Batch vs Streaming processing**
  - [ ] Batch: scheduled intervals, large volumes, acceptable latency (hours/days)
  - [ ] Streaming: real-time/near-real-time, continuous processing, low latency (seconds/minutes)
  - [ ] Micro-batching: hybrid approach for balanced performance
- [ ] **Pipeline orchestration concepts**
  - [ ] DAG (Directed Acyclic Graph) design and dependencies
  - [ ] Idempotency: ensuring pipelines can be safely re-run
  - [ ] Backfilling: reprocessing historical data
  - [ ] Monitoring and alerting for pipeline failures
- [ ] **Data extraction patterns**
  - [ ] Full extraction vs incremental extraction
  - [ ] Change Data Capture (CDC): capturing inserts, updates, deletes
  - [ ] API-based extraction: pagination, rate limiting, authentication
- [ ] **Transformation patterns**
  - [ ] Data cleansing: handling nulls, duplicates, outliers
  - [ ] Data enrichment: joining multiple sources, calculated fields
  - [ ] Data validation: schema validation, data quality checks
  - [ ] Aggregations and windowing operations
- [ ] **Loading strategies**
  - [ ] Append vs upsert (insert/update) patterns
  - [ ] Truncate and load vs incremental load
  - [ ] Handling late-arriving data
- [ ] **Data quality and governance**
  - [ ] Data lineage tracking: understanding data flow and transformations
  - [ ] Data validation frameworks and automated quality checks
  - [ ] Schema evolution and backward compatibility
  - [ ] Access control and data security

### Cloud & Infrastructure (GCP Focus)

- [ ] **Google Cloud Platform core services**
  - [ ] BigQuery: serverless data warehouse, partitioning, clustering, cost optimization
  - [ ] Cloud Storage: data lake patterns, lifecycle policies, storage classes
  - [ ] Dataflow: managed Apache Beam for batch and streaming
  - [ ] Pub/Sub: message queue for event-driven architectures
  - [ ] Cloud Composer: managed workflow orchestration (Apache Airflow)
  - [ ] Dataproc: managed Spark and Hadoop clusters
- [ ] **Infrastructure as Code**
  - [ ] Terraform or GCP Deployment Manager for reproducible infrastructure
  - [ ] Configuration management and version control
- [ ] **Containerization for data workloads**
  - [ ] Docker for packaging data pipelines
  - [ ] Container orchestration basics (GKE - Google Kubernetes Engine)
- [ ] **Cost optimization**
  - [ ] Understanding pricing models (on-demand vs committed use)
  - [ ] Query optimization to reduce costs
  - [ ] Data lifecycle management (hot vs cold storage)

### Data Engineering Patterns

- [ ] **Lambda architecture**: batch + streaming layers for comprehensive data processing
- [ ] **Kappa architecture**: streaming-only approach for simpler systems
- [ ] **Data lake vs data warehouse**: when to use each, lakehouse concepts
- [ ] **Feature stores**: centralized feature management for ML
  - [ ] Feature versioning and reproducibility
  - [ ] Online vs offline feature serving
- [ ] **Data versioning**: tracking data changes over time (DVC, Git-like approaches)
- [ ] **Distributed processing concepts**
  - [ ] Understanding MapReduce paradigm
  - [ ] Spark fundamentals: RDDs, DataFrames, transformations vs actions
  - [ ] Partitioning strategies for distributed data

**Evidence:** ETL/ELT knowledge universal across DE roles; streaming (Kafka, Pub/Sub) critical for real-time use cases; BigQuery and cloud data warehouses standard; data quality and governance increasingly important

---

## 3. Machine Learning Engineering (Level 2.5 - Moderate-Advanced)

### ML Fundamentals (Non-negotiable)

- [ ] Supervised learning: regression, classification, decision trees, ensemble methods
- [ ] Unsupervised learning: clustering, dimensionality reduction (PCA, t-SNE)
- [ ] Model evaluation: cross-validation, metrics (precision, recall, F1, AUC-ROC)
- [ ] Feature engineering: scaling, encoding, feature selection
- [ ] Overfitting/underfitting: regularization (L1/L2), bias-variance tradeoff

### ML Frameworks & Libraries

- [ ] **Scikit-learn**: end-to-end ML workflows
- [ ] **PyTorch** or TensorFlow: neural networks, training loops, custom layers
- [ ] XGBoost, LightGBM: gradient boosting for tabular data
- [ ] Pandas, NumPy: data manipulation at scale
- [ ] SciPy: scientific computing, optimization

### Deep Learning Basics

- [ ] Neural network architectures: MLPs, CNNs, RNNs/LSTMs
- [ ] Training techniques: batch normalization, dropout, learning rate scheduling
- [ ] Transfer learning: using pre-trained models
- [ ] Computer vision basics: image classification, object detection concepts
- [ ] NLP basics: tokenization, embeddings (Word2Vec, GloVe), transformers intro

### Production ML

- [ ] Model deployment: REST APIs (FastAPI, Flask), model serving
- [ ] Model monitoring: performance degradation, data drift detection
- [ ] A/B testing and experimentation frameworks
- [ ] Model versioning and experiment tracking (MLflow, Weights & Biases)
- [ ] Handling model updates and rollback strategies

**Evidence:** 58% of ML postings seek domain experts over generalists; PyTorch/TensorFlow required in nearly all ML roles; Scikit-learn universal

---

## 4. New Programming Paradigms - AI-Assisted Coding (Level 2 - Moderate)

### AI Coding Tools

- [ ] **Cursor**: Composer mode, @-symbols for context, .cursorrules files
- [ ] **Claude Code** (formerly Claude Coder): agentic terminal workflows, task delegation
- [ ] GitHub Copilot: autocomplete, chat, agent modes
- [ ] Prompt engineering for code generation: clear instructions, context management
- [ ] When to use tools vs manual coding: understanding limitations

### Model Context Protocol (MCP)

- [ ] **MCP fundamentals**: what it is, why it matters (now Linux Foundation standard)
- [ ] MCP servers: how to use existing servers (GitHub, file system, databases)
- [ ] Building basic MCP servers: tools, resources, prompts
- [ ] MCP vs APIs: understanding the differences and use cases
- [ ] Security considerations: permissions, data access, trust

### Agentic AI Concepts

- [ ] **Agent frameworks**: LangChain, LangGraph, CrewAI, AutoGen basics
- [ ] Agent patterns: ReAct (Reasoning + Acting), plan-execute loops
- [ ] Multi-agent systems: agent communication, task delegation
- [ ] Tool calling and function calling in LLMs
- [ ] Agentic workflows: when agents add value vs complexity
- [ ] **Prompt engineering**: system prompts, few-shot learning, chain-of-thought

### Context Engineering

- [ ] Managing context windows: what to include/exclude
- [ ] .cursorrules, .clinerules, custom instructions best practices
- [ ] RAG (Retrieval-Augmented Generation) concepts
- [ ] Chunking strategies and semantic search basics
- [ ] Memory systems for agents

**Evidence:** MCP moved to Linux Foundation Dec 2024; 66% of leaders won't hire without AI skills; agent frameworks (LangChain, CrewAI) appearing in job postings; "prompt engineering" now a skill requirement

---

## 5. LLMs & Deep Learning (Level 1.5-2 - Basics to Moderate)

### LLM Fundamentals

- [ ] Transformer architecture: attention mechanism, encoder-decoder
- [ ] Pre-training vs fine-tuning: when to use each approach
- [ ] Popular models: GPT family, Claude, Llama, Gemini capabilities
- [ ] Tokenization and embeddings: how LLMs process text
- [ ] Context windows and their implications

### Working with LLMs (Most Important)

- [ ] **API usage**: OpenAI API, Anthropic API, basic parameters (temperature, max_tokens)
- [ ] **Prompt engineering**: system/user/assistant roles, few-shot examples
- [ ] Output parsing: JSON mode, structured outputs
- [ ] Error handling and rate limiting
- [ ] Cost management and optimization
- [ ] Function calling / tool use

### LLM-Specific Techniques

- [ ] RAG: retrieval systems, vector databases (Pinecone, Weaviate, ChromaDB)
- [ ] Fine-tuning basics: when it's needed, LoRA, PEFT concepts
- [ ] Evaluation: perplexity, BLEU, ROUGE, human evaluation
- [ ] Safety: prompt injection, jailbreaking, content filtering
- [ ] Multimodal models: vision-language models basics

### NLP & Deep Learning

- [ ] Embeddings: sentence transformers, embedding models
- [ ] Text classification and sentiment analysis
- [ ] Named Entity Recognition (NER)
- [ ] Sequence-to-sequence models
- [ ] Attention mechanisms beyond transformers

**Evidence:** LLM fine-tuning in top 3 AI skills; NLP expertise commands premium; 78% overlap between ML and NLP job requirements

---

## 6. MLOps & DevOps (Level 2 - Moderate)

### Core MLOps

- [ ] **ML lifecycle**: data ingestion → training → deployment → monitoring
- [ ] **CI/CD for ML**: model testing, automated retraining pipelines
- [ ] Model versioning: model registry, artifact tracking
- [ ] Experiment tracking: **MLflow**, Weights & Biases, Neptune
- [ ] Feature stores: versioning features, serving features at scale

### Infrastructure & Containers

- [ ] **Docker**: Dockerfiles, multi-stage builds, container optimization
  - [ ] Layer caching for faster builds
  - [ ] Image size optimization
  - [ ] Security scanning and best practices
- [ ] **Kubernetes basics**: pods, deployments, services, ConfigMaps, Secrets
  - [ ] When to use Kubernetes vs simpler alternatives
  - [ ] Resource requests and limits
  - [ ] Health checks and rolling updates
- [ ] Model serving patterns
  - [ ] REST API endpoints for inference
  - [ ] Batch prediction vs real-time serving
  - [ ] Model versioning and A/B testing
- [ ] Workflow orchestration for ML
  - [ ] DAG-based pipeline design
  - [ ] Scheduling and triggering mechanisms
  - [ ] Error handling and retry logic
- [ ] Serverless ML: Cloud Run, Cloud Functions, Vertex AI

### DevOps Fundamentals

- [ ] **CI/CD pipelines**: Jenkins, GitHub Actions, GitLab CI
- [ ] **Git** (essential): branching strategies, merge conflicts, rebasing
- [ ] Infrastructure as Code: Terraform basics, configuration management
- [ ] Monitoring: Prometheus, Grafana, ELK stack basics
- [ ] Linux/Unix: command line proficiency, bash scripting

### ML-Specific Operations

- [ ] Model monitoring: drift detection, performance degradation
- [ ] Data versioning and lineage tracking
- [ ] A/B testing infrastructure
- [ ] Shadow deployments and canary releases
- [ ] Cost optimization for ML infrastructure

**Evidence:** MLOps roles require 70% of listed skills; Docker/Kubernetes in 80%+ of listings; CI/CD pipelines essential; monitoring crucial (Prometheus common)

---

## 7. System Design & Architecture (Level 2 - Moderate)

### System Design Fundamentals

- [ ] Scalability: horizontal vs vertical scaling, load balancing
- [ ] CAP theorem: consistency, availability, partition tolerance trade-offs
- [ ] Database design: when to use SQL vs NoSQL, sharding, replication
- [ ] Caching strategies: Redis, Memcached, CDNs
- [ ] Message queues: Kafka, RabbitMQ, SQS use cases

### Distributed Systems Concepts

- [ ] Microservices vs monoliths: trade-offs, when to use each
- [ ] API design: REST, GraphQL, gRPC
- [ ] Service discovery and load balancing
- [ ] Eventual consistency patterns
- [ ] Fault tolerance and resilience: circuit breakers, retries, timeouts

### ML System Design

- [ ] Data pipeline architecture: batch vs streaming
- [ ] Model serving architecture: online vs offline inference
- [ ] Feature store design
- [ ] ML platform components: training, serving, monitoring
- [ ] Scaling ML systems: GPU clusters, distributed training

### Interview Preparation

- [ ] Design Twitter, Netflix, URL shortener, etc.
- [ ] Back-of-envelope calculations: storage, bandwidth, QPS
- [ ] Trade-off discussions: latency vs consistency vs cost
- [ ] Failure scenarios and mitigation strategies
- [ ] System design frameworks (e.g., RESHADED)

**Evidence:** System design interviews standard for senior roles; architecture skills "more differentiating as AI handles routine code"; distributed systems knowledge critical

---

## 8. Web/Backend Development (Level 1.5 - Basic-Moderate)

### Backend Frameworks

- [ ] **FastAPI** (most common for ML/data): async, automatic docs, type hints
- [ ] Flask: lightweight, APIs, basic web apps
- [ ] API design principles: RESTful conventions, versioning, error handling
- [ ] Request/response lifecycle
- [ ] CORS, authentication basics (JWT tokens)

### Web Technologies

- [ ] HTTP: methods (GET, POST, PUT, DELETE), status codes, headers
- [ ] JSON: serialization, parsing, schema validation (Pydantic)
- [ ] WebSockets for real-time communication (basics)
- [ ] Basic HTML/CSS understanding (for debugging, not deep expertise)
- [ ] JavaScript/TypeScript fundamentals (helpful but not required)

### Databases for Web Apps

- [ ] PostgreSQL: CRUD operations, migrations, indexes
- [ ] ORMs: SQLAlchemy, Django ORM basics
- [ ] Connection pooling and query optimization
- [ ] Database migrations: Alembic, Django migrations

### Authentication & Security

- [ ] JWT tokens: generation, validation
- [ ] OAuth 2.0 flow concepts
- [ ] API keys and rate limiting
- [ ] Basic security: SQL injection, XSS, CSRF concepts
- [ ] HTTPS and SSL/TLS basics

**Evidence:** FastAPI increasingly standard for ML APIs; REST API skills required in 60%+ postings; authentication/security mentioned frequently

---

## 9. Additional Critical Skills

### Cloud Platforms (GCP Focus)

- [ ] **Google Cloud Platform fundamentals**
  - [ ] Compute Engine, Cloud Run, Cloud Functions (serverless)
  - [ ] BigQuery, Cloud Storage, Cloud SQL
  - [ ] Vertex AI for ML workloads
  - [ ] IAM (Identity and Access Management): roles, service accounts, permissions
- [ ] Cloud architecture patterns
  - [ ] Serverless architectures
  - [ ] Event-driven systems with Pub/Sub
  - [ ] Multi-region deployments and disaster recovery
- [ ] **Cost management and optimization**
  - [ ] Understanding billing, quotas, and resource limits
  - [ ] Committed use discounts and preemptible instances
  - [ ] Monitoring with Cloud Monitoring and Cloud Logging
- [ ] **Security fundamentals**
  - [ ] VPC networks and firewall rules
  - [ ] Encryption at rest and in transit
  - [ ] Secret management (Secret Manager)
  - [ ] Compliance and data residency
