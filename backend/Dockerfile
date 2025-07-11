# syntax=docker/dockerfile:1

# Builder stage
FROM python:3.11 AS builder
WORKDIR /app
COPY ./requirements.txt ./
RUN pip install --user -r requirements.txt

# Final stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
