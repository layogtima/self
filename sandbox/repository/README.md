# MONO | Inventory Management System

A clean, monochromatic personal inventory management system for tracking all your physical belongings - from tech gadgets to creative tools.

## 🔥 Features

- **Full CRUD Operations**: Add, edit, view, and delete inventory items, categories, and tags
- **Detailed Item Properties**: Track name, value, category, condition, serial number, purchase info, and more
- **Flexible Organization**: Categorize items, add tags, and filter your inventory
- **List & Grid Views**: Toggle between different viewing modes
- **Mobile Responsive**: Works on all devices from phones to desktops
- **Theme Support**: Multiple visual themes including dark mode
- **Assistive Mode**: Enhanced accessibility features and LLM navigation support
- **Local Storage**: All data saved to your browser (no server required)
- **Import/Export**: Backup and restore your inventory data

## 🛠️ Technical Implementation

- **Vue 3**: Frontend framework (CDN version for simplicity)
- **Tailwind CSS**: Utility-first styling
- **LocalStorage**: Client-side data persistence
- **Single Page Application**: With Vue Router for navigation
- **Modular Design**: Components separated for maintainability

## 🚀 Getting Started

1. Clone or download this repository
2. Open `index.html` in your browser
3. Start adding your items!

That's it! No build process or server setup required.

## 📁 File Structure

- **index.html**: Main HTML file with Vue and Tailwind setup
- **styles.css**: Custom styles and theme variables
- **hydration.js**: Mock data and storage logic
- **components.js**: All Vue components
- **app.js**: Main application and routing logic

## 🎛️ Settings & Customization

MONO offers extensive customization options:

- **Theme**: Choose from Default, Neon Brutalist, Eco, or Absurd
- **Dark Mode**: Toggle between light and dark modes
- **View Mode**: Grid or list display
- **Currency**: Change the currency symbol for values
- **Date Format**: Customize how dates are displayed
- **Experimental Features**: Enable cutting-edge features

## 🔮 Potential Future Enhancements

- **Cloud Sync**: Backup to cloud storage
- **Multi-user Support**: Share inventories with family or roommates
- **QR Code Generation**: For quick item identification
- **Warranty Tracking**: Get notifications before warranties expire
- **Value Appreciation/Depreciation**: Track value changes over time
- **Insurance Integration**: Generate reports for insurance purposes
- **Image Uploads**: Add photos of your items

## 👩‍💻 For Developers

This project is designed to be easy to modify and extend:

- All data is managed through the `DataService` in `hydration.js`
- Components are organized by feature in `components.js`
- Theme variables are in CSS custom properties in `styles.css`
- The application structure follows Vue best practices

To replace the mock data layer with a real backend:

1. Modify the functions in `DataService` to make API calls
2. Keep the same function signatures to maintain compatibility
3. Update the storage layer as needed

## License

This project is open source under the GPLv3 License.

---

Built with ❤️ by Amartha for Absurd Industries
