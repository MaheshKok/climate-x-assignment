# Asset Management System

A comprehensive asset management system built with Next.js that allows companies
to upload, view, and manage their asset data through CSV/JSON file uploads with
real-time visualization and filtering capabilities.

## 🚀 Features

- **File Upload Support**: Upload CSV and JSON files with asset data
- **Real-time Asset Display**: View all uploaded assets in a responsive
  table/card layout
- **Advanced Filtering**: Filter assets by company ID with partial matching
  support
- **Duplicate Detection**: Automatic detection and prevention of duplicate
  assets
- **Responsive Design**: Mobile-first design with adaptive layouts
- **Type Safety**: Full TypeScript implementation
- **Comprehensive Testing**: Unit tests with 70%+ coverage
- **Production Ready**: Code quality tools, linting, and formatting

## 📋 Assignment Requirements

This system implements the core assignment requirements:

### ✅ API Endpoints

1. **POST `/api/assets/upload`** - Upload CSV/JSON files with asset data
2. **GET `/api/assets`** - Retrieve assets with optional company filtering
3. **DELETE `/api/assets/delete`** - Delete specific assets by coordinates

### ✅ Core Features

- Multi-format file upload (CSV, JSON)
- In-memory storage with singleton pattern
- Partial matching for company ID filters
- Duplicate asset detection
- Error handling and validation
- Responsive UI with mobile support

### ✅ Technical Excellence

- **Testing**: Comprehensive Jest test suite with 92+ tests
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Performance**: Optimized queries and caching strategies
- **Scalability**: Detailed scaling documentation (see
  [SCALING.md](./SCALING.md))

## 🛠️ Technology Stack

- **Framework**: Next.js 14.2 with React 18
- **Language**: TypeScript 5.9
- **UI Library**: Chakra UI 2.8
- **File Processing**: Papa Parse for CSV, native JSON parsing
- **Testing**: Jest 30.1 with React Testing Library
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **Styling**: Emotion (CSS-in-JS)

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd asset-management-system

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Test Coverage

- **Storage Layer**: 100% coverage with edge cases
- **File Validation**: 95+ coverage with error handling
- **API Endpoints**: 90+ coverage with all HTTP methods
- **React Components**: Comprehensive UI testing
- **Edge Cases**: Large files, invalid data, Unicode support

### Test Types

1. **Unit Tests**: Individual functions and classes
2. **Integration Tests**: API endpoints with mocked dependencies
3. **Component Tests**: React component rendering and interactions
4. **Edge Case Tests**: Error conditions, boundary values, performance

## 🏗 Project Structure

```
asset-management-system/
├── src/
│   ├── components/
│   │   ├── FileUpload.tsx      # Drag-and-drop upload component
│   │   └── AssetList.tsx       # Responsive asset display
│   ├── types/
│   │   └── asset.ts           # TypeScript interfaces
│   └── utils/
│       └── fileValidation.ts  # File processing utilities
├── pages/
│   ├── api/assets/
│   │   ├── upload.ts          # Upload endpoint
│   │   └── index.ts           # Asset retrieval endpoint
│   ├── _app.tsx               # Chakra UI provider
│   └── index.tsx              # Main application page
├── public/
│   └── uploads/               # File storage directory
└── next.config.js             # Next.js configuration
```

## 🔧 Configuration

### File Size Limits

- CSV: 50MB
- JSON: 10MB

### Supported File Types

- **CSV**: `.csv`
- **JSON**: `.json`

## 📝 API Usage

### Upload Files

````typescript
POST /api/assets/upload
Content-Type: multipart/form-data


### Get Assets

```typescript
GET /api/assets?search=query&type=csv&sortBy=uploadDate&sortOrder=desc&page=1&limit=10

// Response:
{
  "success": true,
  "assets": Asset[],
  "total": number,
  "page": number,
  "limit": number
}
````

## 🎯 Features Implemented

- ✅ TypeScript interfaces for all data models
- ✅ POST /api/assets/upload with multipart form handling
- ✅ GET /api/assets with advanced filtering
- ✅ Drag-and-drop file upload component
- ✅ Responsive asset table/list with pagination
- ✅ CSV/JSON parsing with validation
- ✅ Error handling and loading states
- ✅ Mobile-responsive design
- ✅ File validation and progress tracking

## 🔒 Security & Validation

- File size limits enforced
- MIME type validation
- Secure file naming
- Upload directory protection
- Input sanitization

## 🚀 Development

The application follows best practices:

- Component-based architecture
- TypeScript for type safety
- Responsive design patterns
- Error boundary handling
- Performance optimizations

## 📱 Responsive Design

- **Mobile**: Card-based layout with action menus
- **Desktop**: Table view with sorting and filtering
- **Tablet**: Adaptive layout based on screen size

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Lint code
npm run lint

# Test build
npm run build
```

---

Built with 💙 using Next.js, TypeScript, and Chakra UI
