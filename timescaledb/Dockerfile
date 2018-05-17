FROM ubuntu:16.04
MAINTAINER Shubham Jain <s.jain@imperial.ac.uk>

WORKDIR /root

RUN apt-get update -q && apt-get upgrade -y --no-install-recommends \
    && apt-get install -y git \
    && apt-get install -y postgresql-client

RUN git clone https://github.com/OPAL-Project/OPAL-Database.git

CMD ["psql", "-h", "timescaledb", "database", "opal", "-f", "OPAL-Database/timescaledb/timescale.sql"]
