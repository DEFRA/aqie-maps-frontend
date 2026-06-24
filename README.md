# aqie-maps-frontend

[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_aqie-maps-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=DEFRA_aqie-maps-frontend)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_aqie-maps-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_aqie-maps-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_aqie-maps-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_aqie-maps-frontend)

Node.js Hapi frontend service for the Air Quality interactive map.

- [Requirements](#requirements)
  - [Node.js](#nodejs)
  - [Docker](#docker)
- [Local development](#local-development)
  - [Setup](#setup)
  - [Development](#development)
    - [Docker Compose](#docker-compose)
    - [npm](#npm)
  - [Production](#production)
    - [Docker Compose](#docker-compose-1)
    - [npm](#npm-1)
  - [Npm scripts](#npm-scripts)
  - [Update dependencies](#update-dependencies)
  - [Formatting](#formatting)
    - [Windows prettier issue](#windows-prettier-issue)
- [Server-side caching](#server-side-caching)
- [Dependabot](#dependabot)
- [SonarCloud](#sonarcloud)
- [Licence](#licence)
  - [About the licence](#about-the-licence)

## Requirements

### Node.js

Please install [Node.js](http://nodejs.org/) `>= v24` and [npm](https://nodejs.org/) `>= v9`. You will find it
easier to use the Node Version Manager [nvm](https://github.com/creationix/nvm)

To use the correct version of Node.js for this application, via nvm:

```bash
cd aqie-maps-frontend
nvm use
```

### Docker

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose). Docker is the recommended way to run the service locally as it starts Redis and Floci (AWS stub) automatically alongside the app.

## Local development

### Setup

Install application dependencies:

```bash
npm install --ignore-scripts
```

Optionally install git hooks:

```bash
npm run setup:husky
```

### Development

#### Docker Compose

The recommended way to run the project locally. Starts Redis, Floci (AWS stub) and the app together, with hot-reloading enabled. Requires a `.env` file at the project root if you need to override any defaults:

```bash
docker compose up --build
```

The `.env` file is loaded automatically via the `env_file` directive in `compose.yml`.

#### npm

> **Note:** requires Redis running on `localhost:6379`. You can start it with `docker compose up redis` if needed.

The `dev` script loads `.env` automatically via `--env-file-if-exists`, so no extra shell exports are needed:

```bash
npm run dev
```

### Production

#### Docker Compose

```bash
docker compose build --build-arg target=production
docker compose up
```

Or build and run the production image directly:

```bash
docker build --no-cache --tag aqie-maps-frontend .
docker run -p 3000:3000 --env-file .env aqie-maps-frontend
```

#### npm

Builds the frontend assets then starts the server in production mode:

```bash
npm start
```

### Npm scripts

All available npm scripts can be seen in [package.json](./package.json). To view them in your terminal:

```bash
npm run
```

### Update dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

```bash
ncu --interactive --format group
```

### Formatting

#### Windows prettier issue

If you are having issues with formatting of line breaks on Windows update your global git config by running:

```bash
git config --global core.autocrlf false
```

## Server-side caching

We use Catbox for server-side caching. By default the service will use CatboxRedis when deployed and CatboxMemory for
local development.
You can override the default behaviour by setting the `SESSION_CACHE_ENGINE` environment variable to either `redis` or
`memory`.

Please note: CatboxMemory (`memory`) is _not_ suitable for production use! The cache will not be shared between each
instance of the service and it will not persist between restarts.

## Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

## Checking upstream connectivity

To verify the frontend can communicate with `aqie-back-end` and `aqie-forecast-api`, use the proxy endpoints the frontend exposes. These make server-side requests to the configured upstream URLs and return the results.

**Locally** (default port 3000):

```bash
curl -sS -o /dev/null -w "back-end (monitoring stations): %{http_code}\n" \
  http://localhost:3000/api/monitoring-stations

curl -sS -o /dev/null -w "forecast-api (forecasts): %{http_code}\n" \
  http://localhost:3000/api/forecasts
```

**On CDP** (substitute the environment hostname):

```bash
curl -sS -o /dev/null -w "back-end (monitoring stations): %{http_code}\n" \
  https://aqie-maps-frontend.dev.cdp-int.defra.cloud/api/monitoring-stations

curl -sS -o /dev/null -w "forecast-api (forecasts): %{http_code}\n" \
  https://aqie-maps-frontend.dev.cdp-int.defra.cloud/api/forecasts
```

Both should return `200`. A `500` means the upstream is reachable but returned an error; a connection error or `502` from inside a CDP terminal means the app process is not running — check logs for the startup error.


## SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties).

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties).

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
