# Asset Management System

A comprehensive Next.js application for managing digital assets with advanced
upload, validation, and display capabilities.

## 🚀 Features

### File Upload & Management

- **Drag-and-Drop Interface**: Intuitive file upload with visual feedback
- **Multi-file Support**: Upload up to 10 files simultaneously
- **File Validation**: Automatic validation with size and type checking
- **Progress Tracking**: Real-time upload progress with error handling

### File Type Support

- **CSV Files**: Up to 50MB with automatic parsing and preview
- **JSON Files**: Up to 10MB with structure analysis
- **Images**: JPG, PNG, GIF, WebP up to 5MB
- **Documents**: PDF, TXT, DOC, DOCX up to 20MB

### Asset Display & Management

- **Responsive Design**: Mobile-first approach with card/table views
- **Advanced Filtering**: Filter by type, search by name/tags
- **Sorting Options**: Sort by name, size, type, upload date
- **Pagination**: Efficient browsing with configurable page sizes
- **Metadata Display**: Tags, descriptions, file information

### API Endpoints

- `POST /api/assets/upload` - File upload with validation
- `GET /api/assets` - Asset retrieval with filtering

## 🛠 Tech Stack

- **Framework**: Next.js 14+ with TypeScript
- **UI Library**: Chakra UI with Emotion
- **File Processing**: Multer, PapaParse
- **Validation**: Custom validation utilities
- **Styling**: TypeScript interfaces and responsive design

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start

# Type checking
npm run type-check
```

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
- Images: 5MB
- Documents: 20MB

### Supported File Types

- **CSV**: `.csv`
- **JSON**: `.json`
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Documents**: `.pdf`, `.txt`, `.doc`, `.docx`

## 📝 API Usage

### Upload Files

```typescript
POST /api/assets/upload
Content-Type: multipart/form-data

// Form fields:
// - file: File (required)
// - tags: string (optional, comma-separated)
// - description: string (optional)
```

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
```

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
