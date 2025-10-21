# AutoCAD Line Type Builder

A web-based tool for creating custom .lin files for AutoCAD line types. Build line patterns using drag-and-drop design cards with dashes, dots, and text elements.

## Features

- **Visual Design Interface**: Create line types using design cards
- **Real-time Preview**: See your line type pattern as you build (coming soon)
- **Multiple Element Types**: Support for dashes, dots, and text elements
- **AutoCAD Compatible**: Generates proper .lin file format
- **Export Options**: Copy code or download .lin files
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Project Structure

```
autocad-linetype-builder/
├── index.html          # Main application interface
├── css/
│   └── style.css      # Application styling
├── js/
│   └── script.js      # Line type builder logic
├── package.json       # Project dependencies
└── README.md         # Project documentation
```

## How to Use

1. **Enter Line Type Information**
   - Provide a name for your line type (max 31 characters)
   - Add a description explaining the line type's purpose

2. **Add Design Elements**
   - Click "+ Add Element" to add dashes, dots, or text
   - Each element can be customized individually
   - Remove elements using the × button on each card

3. **Generate and Export**
   - View the generated .lin code in real-time
   - Copy the code to clipboard
   - Download as a .lin file for use in AutoCAD

## Element Types

### Dash
- Positive values create visible line segments
- Negative values create gaps/spaces
- Length determines the size of the dash or gap

### Dot  
- Always has a length of 0
- Creates a point marker in the line pattern
- Useful for center lines and detail marks

### Text
- Embeds text strings within the line pattern
- Configurable rotation (Upright, Relative, Absolute)
- Adjustable scale, position offsets
- Uses STANDARD text style by default

## Getting Started

### Prerequisites

- Node.js (optional, for development server)
- Modern web browser
- AutoCAD (to use generated .lin files)

### Installation

1. Clone or download this project
2. Open the project folder in VS Code
3. Install dependencies (optional):
   ```bash
   npm install
   ```

### Running the Application

#### Option 1: Using Live Server (Recommended)
```bash
npm start
```
This will start a development server at `http://localhost:8080`

#### Option 2: Using npm dev server
```bash
npm run dev
```
This will start a development server at `http://localhost:3000`

#### Option 3: Direct File Opening
Simply open `index.html` in your web browser by double-clicking the file.

## AutoCAD .lin File Format

The generated files follow AutoCAD's linetype definition format:

```
*LINETYPE_NAME,Description text
A,length1,length2,length3,...
```

- First line: Asterisk + name + comma + description
- Second line: "A" + comma + pattern values
- Positive numbers = visible dashes
- Negative numbers = gaps  
- Zero = dots
- Text elements = ["text","style",scale,rotation,x,y]

## Browser Support

This website supports all modern browsers including:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the package.json file for details.

## Development Notes

- Uses modern CSS Grid and Flexbox for layouts
- Implements smooth scrolling and intersection observer APIs
- Mobile-first responsive design approach
- Follows web accessibility best practices