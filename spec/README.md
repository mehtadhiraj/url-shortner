# URL Shortener Service - Test Suite

This directory contains comprehensive unit tests for the URL Shortener Service using Jest and TypeScript.

## Test Structure

```
spec/
├── setup.ts                    # Jest setup and global mocks
├── utils/
│   └── testHelpers.ts          # Test utilities and data factories
├── services/
│   ├── ShortlinkService.test.ts    # ShortlinkService unit tests
│   └── StreamProducer.test.ts      # StreamProducer unit tests
├── consumer/
│   └── ClickStreamConsumer.test.ts # ClickStreamConsumer unit tests
└── controllers/
    └── LinksController.test.ts     # LinksController unit tests
```

## Test Coverage

### ShortlinkService Tests
- ✅ Create short link (new and existing)
- ✅ Generate unique aliases
- ✅ Handle vanity URLs
- ✅ Resolve aliases and publish click events
- ✅ Record events from stream messages
- ✅ Generate comprehensive stats (daily/hourly)
- ✅ Error handling for all scenarios

### StreamProducer Tests
- ✅ Initialize Redis streams producer
- ✅ Publish messages to Redis streams
- ✅ Handle stream options and configurations
- ✅ Error handling and logging
- ✅ Large payloads and special characters

### ClickStreamConsumer Tests
- ✅ Consumer lifecycle (start/stop)
- ✅ Message processing and acknowledgment
- ✅ Error handling and retry logic
- ✅ Consumer group management
- ✅ Batch message processing

### LinksController Tests
- ✅ POST /links - Create short links
- ✅ GET /:alias - Resolve aliases
- ✅ GET /links/:alias/stats - Get click statistics
- ✅ Error handling for all endpoints
- ✅ Input validation and edge cases

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Files
```bash
# Run only ShortlinkService tests
npx jest ShortlinkService.test.ts

# Run only controller tests
npx jest controllers/

# Run tests matching a pattern
npx jest --testNamePattern="should create"
```

## Test Configuration

The tests use the following configuration:

- **Test Environment**: Node.js
- **Test Runner**: Jest with ts-jest preset
- **Mocking**: Automatic mocking of external dependencies
- **Coverage**: Comprehensive coverage reporting

## Mocking Strategy

### Global Mocks (in setup.ts)
- Logger - Prevents console output during tests
- Redis Provider - Mocks Redis connections
- Config Loader - Provides test configuration

### Service Mocks
- Repository layer mocked for database operations
- Redis streams provider mocked for stream operations
- External dependencies isolated from tests

## Test Data Factories

The `TestDataFactory` class provides convenient methods to create test data:

```typescript
import { TestDataFactory } from './utils/testHelpers';

// Create test request data
const request = TestDataFactory.createShortLinkRequest({
  url: 'https://custom.example.com',
  campaignId: 'custom-campaign'
});

// Create multiple stream messages
const messages = TestDataFactory.createMultipleStreamMessages(5);
```
