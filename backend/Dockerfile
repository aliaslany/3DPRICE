FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y python3 python3-pip curl ca-certificates && rm -rf /var/lib/apt/lists/*
# Install/build CuraEngine separately in production. This image expects a CuraEngine binary
# to be copied to /usr/local/bin or mounted at runtime.
WORKDIR /app
COPY requirements.txt .
RUN pip3 install --break-system-packages -r requirements.txt
COPY app ./app
COPY profiles ./profiles
ENV CURA_ENGINE=/usr/local/bin/CuraEngine
EXPOSE 8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]