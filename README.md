# 📜 **XML Parser Application - Detailed Documentation**

## 🚀 Introduction
Hey! Hope you're doing well. I’ve completed the assignment, and let me walk you through the entire project. This application supports both reading existing files and allowing users to upload data for parsing and displaying structured information. I’ve made some improvements to the UI as well to enhance the user experience.

## 📂 **Project Overview**
This application is designed to:

1. **Read XML files**: Users can upload XML files, and the app will parse them, extracting key data.
2. **User Upload & Data Handling**: Users can manually input data and submit it.
3. **UI Enhancements**: The interface is designed to be intuitive, with better form handling and validation.

## 🛠️ **How It Works**

### **1️⃣ Reading and Parsing XML Files**

When a user uploads an XML file, the application reads its contents and parses it. Here’s how it works:

- **Reading Files:**
  - The file is selected using an `<input type='file'>` element.
  - JavaScript reads the file using `FileReader`.

- **Parsing XML:**
  - The `DOMParser` API is used to convert XML into a structured format.
  - The data is extracted and displayed in an easy-to-read manner.

📌 *Example Code for Reading XML:*
```javascript
const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const xmlString = e.target.result;
            parseXML(xmlString);
        };
        reader.readAsText(file);
    }
};
```

📌 *Example Code for Parsing XML:*
```javascript
const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const name = xmlDoc.getElementsByTagName("name")[0]?.textContent;
    console.log("Extracted Name:", name);
};
```

### **2️⃣ User Data Input & Form Handling**
Users can manually input data into a form that captures details like:
✅ Name  
✅ Date  
✅ Signature  
✅ Radio Buttons  

Some fields are mandatory, ensuring proper data submission. Form validation is implemented to ensure users don’t miss crucial fields.

📌 *Example Form Handling Code:*
```javascript
const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    console.log("User Data:", Object.fromEntries(formData));
};
```

### **3️⃣ UI Enhancements & Improvements**
I focused on making the UI more user-friendly. To improve date selection, I used a calendar library, making it easier to pick dates instead of typing them manually.

📌 *Date Picker Implementation:*
```javascript
<DatePicker selected={selectedDate} onChange={(date) => setSelectedDate(date)} />
```

I also tried to enhance the form layout and styling to make it more professional.

### **4️⃣ Validation & Error Handling**
To prevent user mistakes, the application includes:
✅ Required field validation  
✅ Proper error messages for incorrect formats  
✅ Alerts for missing data  

📌 *Validation Example:*
```javascript
if (!name || !date) {
    alert("Please fill all required fields!");
    return;
}
```

### **5️⃣ Sample XML Testing**
I tested the application with various XML files, and everything worked fine. Users can add different fields, but a few are mandatory, such as:
✔️ Name  
✔️ Date  
✔️ Signature  
✔️ Radio selection  

## 📌 **Final Note**
There are two more tabs where I initially worked on the project from Day 1. At first, I was a little confused, and I tried to create the form using the given data. However, later, I realized how I needed to structure everything properly. 😊

Hope this documentation gives you a clear understanding of my efforts! Let me know if you need any changes. 🚀

