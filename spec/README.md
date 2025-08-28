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
- **Timeout**: 30 seconds for async operations

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

## Important Test Scenarios Covered

### Edge Cases
- Empty inputs and null values
- Invalid URL formats
- Non-existent aliases
- Database connection failures
- Redis stream errors
- Large payload handling

### Business Logic
- Duplicate link prevention
- Vanity URL handling
- Click tracking and analytics
- Date range filtering for stats
- Consumer group management

### Error Handling
- Custom error propagation
- Service layer error handling
- Network timeout scenarios
- Validation failures

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Mocking**: External dependencies are properly mocked
3. **Coverage**: All public methods and error paths are tested
4. **Readability**: Tests follow AAA pattern (Arrange, Act, Assert)
5. **Performance**: Tests run quickly with proper mocking
6. **Encapsulation**: Only test public interfaces, avoid accessing private properties

## Troubleshooting

### Common Issues

1. **Jest not found**: Install dependencies with `npm install`
2. **TypeScript errors**: Ensure `@types/jest` is installed
3. **Mock errors**: Check that all external dependencies are mocked
4. **Timeout errors**: Increase timeout for slow async operations

### Debug Mode
```bash
# Run tests with debug output
npx jest --verbose

# Run a single test file with debugging
npx jest ShortlinkService.test.ts --verbose
``` 