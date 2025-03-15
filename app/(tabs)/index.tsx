import React, { useState } from "react";
import {
  View,
  Button,
  TextInput,
  Alert,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
// @ts-ignore
import { parseString } from "react-native-xml2js";
import DateTimePicker from "@react-native-community/datetimepicker";
import Signature from "react-native-signature-canvas";
import { BoxedTextInput } from "@/components/BoxTextInput";
// @ts-ignore
import image from "@/assets/images/image.jpeg";

const XmlParserScreen: React.FC = () => {
  const [xmlInput, setXmlInput] = useState("");
  const [parsedResult, setParsedResult] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showJsonResult, setShowJsonResult] = useState(true);
  const [isSourceSelected, setIsSourceSelected] = useState(false);

  const handleFileParse = async () => {
    try {
      setIsSourceSelected(true);
      const asset = Asset.fromModule(require("../../assets/sample_xml1.txt"));
      await asset.downloadAsync();
      if (!asset.localUri) {
        Alert.alert("Error", "File URI not found");
        return;
      }
      const content = await FileSystem.readAsStringAsync(asset.localUri);
      parseXml(content);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to read XML file");
    }
  };

  const handleInputParse = () => {
    setIsSourceSelected(true);
    setShowInput(true);
    setShowJsonResult(true);
    setShowForm(false);
    Alert.alert(
      "XML Input Guidelines",
      "Your XML should include these field types:\n\n" +
      "- Text Fields (textField, text, input)\n" +
      "- Date Input (dateInput, date)\n" +
      "- Radio Buttons (radioGroup, radio)\n" +
      "- Drawing Field (drawingField, signature)\n\n" +
      "The parser supports various XML formats and will try to extract form fields from any structure. If required fields are missing, defaults will be added."
    );
  };

  const parseXml = (xml: string) => {
    // Add XML declaration if missing
    if (!xml.trim().startsWith("<?xml")) {
      xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
    }

    // Set options for xml2js parser to be more lenient
    const parserOptions = {
      explicitArray: true,
      normalizeTags: false, // Don't convert tags to lowercase
      explicitCharkey: true,
      trim: true,
      attrkey: "$",
      charkey: "_",
    };

    parseString(xml, parserOptions, (err: any, result: any) => {
      if (err) {
        console.error("Parsing error:", err);
        Alert.alert(
          "XML Parsing Error",
          `Error: ${err.message}\n\nPlease check your XML syntax and try again.`
        );
        return;
      }

      try {
        const formattedJson = JSON.stringify(result, null, 2);
        console.log("Parsed JSON:", formattedJson);
        setParsedResult(formattedJson);

        // Generate form fields from the parsed XML
        const extractedFields = extractFormFields(result);
        setFormFields(extractedFields);

        // Check if required fields are present
        const requiredTypes = ["text", "date", "radio", "signature"];
        const existingTypes = extractedFields.map((field) => field.type);
        const missingTypes = requiredTypes.filter(
          (type) => !existingTypes.includes(type)
        );

        if (missingTypes.length > 0) {
          Alert.alert(
            "Missing Required Fields",
            `Your XML is missing these required field types: ${missingTypes.join(
              ", "
            )}\n\nDefault fields will be added.`
          );
        }

        // Show the form regardless of missing fields (defaults will be added)
        setShowForm(true);
      } catch (error) {
        console.error("Form extraction error:", error);
        Alert.alert(
          "Form Extraction Error",
          `Failed to extract form fields from XML: ${error instanceof Error ? error.message : String(error)
          }\n\nDefault form will be shown.`
        );

        // Show the form with default fields
        setShowForm(true);
      }
    });
  };

  const extractFormFields = (parsedXml: any): any[] => {
    const fields: any[] = [];

    try {
      // Map of element names to field types
      const elementTypeMap: Record<string, string> = {
        textField: "text",
        dateInput: "date",
        radioGroup: "radio",
        drawingField: "signature",
        selectField: "radio", // Treat select as radio for now
        checkboxGroup: "radio", // Treat checkbox as radio for now
        textArea: "text", // Treat textarea as text for now
        fileUpload: "text", // Treat file upload as text for now
        hiddenField: "text", // Treat hidden as text for now
        button: "text", // Ignore buttons or treat as text
      };

      // Recursively search for form fields in the XML structure
      const findFormFields = (obj: any, path: string = "") => {
        if (!obj || typeof obj !== "object") return;

        // Check if this object looks like a form field
        if (isFormField(obj)) {
          processFormField(obj, fields);
          return;
        }

        // Process each property of the object
        Object.keys(obj).forEach((key) => {
          // Skip $ property which contains attributes in xml2js
          if (key === "$") return;

          // Check if the key is one of our known field types
          if (elementTypeMap[key]) {
            const fieldData = obj[key];
            if (Array.isArray(fieldData)) {
              fieldData.forEach((field) => {
                // Add the type to the field object based on the element name
                field._fieldType = elementTypeMap[key];
                processFormField(field, fields);
              });
            } else if (fieldData) {
              // Add the type to the field object based on the element name
              fieldData._fieldType = elementTypeMap[key];
              processFormField(fieldData, fields);
            }
            return;
          }

          const value = obj[key];

          // If it's an array, process each item
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              findFormFields(item, `${path}.${key}[${index}]`);
            });
          }
          // If it's a nested object, process it recursively
          else if (typeof value === "object" && value !== null) {
            findFormFields(value, `${path}.${key}`);
          }
        });
      };

      // Check if an object represents a form field
      const isFormField = (obj: any): boolean => {
        // Check for common form field indicators

        // Check if it's one of our known field types by its _fieldType property
        if (obj._fieldType) {
          return true;
        }

        // Check for standard form structure (like in sample_xml1.txt)
        if (obj.type && (obj.label || obj.n || obj.name)) {
          return true;
        }

        // Check for fdtType attribute which indicates form fields in task_xml.txt
        if (
          obj.$ &&
          (obj.$.fdtType === "text" ||
            obj.$.fdtType === "date" ||
            obj.$.fdtType === "radioList" ||
            obj.$.fdtType === "signature" ||
            obj.$.fdtType === "textField")
        ) {
          return true;
        }

        // Check for g elements with fdtFieldName attribute
        if (obj.$ && obj.$.fdtFieldName) {
          return true;
        }

        // Check for elements with id and label (like in the user's XML)
        if (obj.$ && obj.$.id && obj.label) {
          return true;
        }

        // Check for elements that have both id and label as child elements
        if (obj.id && obj.label) {
          return true;
        }

        return false;
      };

      // Process a form field and add it to the fields array
      const processFormField = (field: any, fieldsArray: any[]) => {
        // Try to determine field type
        let type = field._fieldType || "text"; // Use _fieldType if available, otherwise default to text
        let label = "";
        let id = "";
        let options: string[] = [];
        let required = false;
        let value = "";

        // Handle standard form structure (like in sample_xml1.txt)
        if (field.type && Array.isArray(field.type)) {
          type =
            field.type[0] && typeof field.type[0] === "string"
              ? field.type[0].toLowerCase() || type
              : type;
        }

        // Try to extract ID/name
        if (field.$ && field.$.id) {
          id = field.$.id;
        } else if (field.id && typeof field.id === "string") {
          id = field.id;
        } else if (field.id && Array.isArray(field.id)) {
          id = field.id[0] || "";
        } else if (field.name && Array.isArray(field.name)) {
          id = field.name[0] || "";
        } else if (field.n && Array.isArray(field.n)) {
          id = field.n[0] || "";
        } else if (field.$ && field.$.fdtFieldName) {
          id = field.$.fdtFieldName;
        }

        // If no ID found, generate one based on the field count
        if (!id) {
          id = `field_${fieldsArray.length}`;
        }

        // Try to extract label
        if (field.label && Array.isArray(field.label)) {
          // Handle array of labels
          if (typeof field.label[0] === "string") {
            label = field.label[0];
          } else if (field.label[0] && field.label[0]._) {
            // Handle xml2js object with _ property
            label = field.label[0]._;
          } else if (field.label[0]) {
            // Try to convert to string
            try {
              label = String(field.label[0]);
            } catch (e) {
              label = "";
            }
          }
        } else if (field.label && typeof field.label === "string") {
          label = field.label;
        } else if (field.label && field.label._) {
          // Handle xml2js object with _ property
          label = field.label._;
        } else if (field.text && Array.isArray(field.text)) {
          // Try to extract label from text elements
          const textElement = field.text[0];
          if (textElement && textElement.tspan) {
            label = extractTextFromTspans(textElement.tspan);
          }
        }

        // If no label found, use the ID
        if (!label) {
          label = id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
        }

        // Try to determine if field is required
        if (field.required && Array.isArray(field.required)) {
          required = field.required[0] === "true";
        } else if (field.required && typeof field.required === "string") {
          required = field.required === "true";
        } else if (field.required && field.required._) {
          // Handle xml2js object with _ property
          required = field.required._ === "true";
        } else if (field.$ && field.$.fdtMandatory) {
          required = field.$.fdtMandatory === "true";
        } else if (field.$ && field.$.required) {
          required = field.$.required === "true";
        }

        // Handle options for radio buttons, select fields, and checkbox groups
        if (type === "radio") {
          // Check for options in different formats
          if (field.options && Array.isArray(field.options)) {
            // Format: <options><option>Value</option></options>
            const optionsArray = field.options[0]?.option || [];
            options = Array.isArray(optionsArray)
              ? optionsArray.map((opt: any) => {
                  if (typeof opt === "string") return opt;
                  if (opt.label && Array.isArray(opt.label))
                    return String(opt.label[0] || "");
                  if (opt.value && Array.isArray(opt.value))
                    return String(opt.value[0] || "");
                  if (opt._) return String(opt._); // Handle xml2js object with _ property
                  return String(opt);
                })
              : [];
          } else if (field.option && Array.isArray(field.option)) {
            // Format: <radioGroup><option>...</option></radioGroup>
            options = field.option.map((opt: any) => {
              if (typeof opt === "string") return opt;
              if (opt.label && Array.isArray(opt.label))
                return String(opt.label[0] || "");
              if (opt.value && Array.isArray(opt.value))
                return String(opt.value[0] || "");
              if (opt._ && typeof opt._ === "string") return String(opt._); // Handle xml2js object with _ property
              if (opt.$ && opt.$.value) return String(opt.$.value);
              return opt.$ && opt.$.id ? String(opt.$.id) : String(opt);
            });
          }
        }
        

        // Handle fdtType for task_xml.txt structure
        if (field.$ && field.$.fdtType) {
          switch (
          typeof field.$.fdtType === "string"
            ? field.$.fdtType.toLowerCase()
            : ""
          ) {
            case "textfield":
            case "text":
              type = "text";
              break;
            case "date":
              type = "date";
              break;
            case "radiolist":
              type = "radio";
              break;
            case "signature":
              type = "signature";
              break;
          }
        }

        // Extract default value if available
        if (field.value && Array.isArray(field.value)) {
          value = field.value[0] || "";
        } else if (field.value && typeof field.value === "string") {
          value = field.value;
        } else if (field.value && field.value._) {
          // Handle xml2js object with _ property
          value = field.value._;
        } else if (field.defaultValue && Array.isArray(field.defaultValue)) {
          value = field.defaultValue[0] || "";
        } else if (field.defaultValue && field.defaultValue._) {
          // Handle xml2js object with _ property
          value = field.defaultValue._;
        }

        // Add the field to our array if it's not already there
        if (!fieldsArray.some((f) => f.id === id)) {
          fieldsArray.push({
            id,
            type,
            label,
            options,
            value,
            required,
          });
        }
      };

      // Helper function to extract text from nested tspan elements
      const extractTextFromTspans = (tspans: any[]): string => {
        if (!Array.isArray(tspans)) return "";

        let text = "";
        const processTspan = (tspan: any) => {
          if (typeof tspan === "string") {
            text += tspan;
          } else if (tspan.tspan && Array.isArray(tspan.tspan)) {
            tspan.tspan.forEach(processTspan);
          } else if (tspan._) {
            text += tspan._;
          } else if (tspan.$ && tspan.$.value) {
            text += tspan.$.value;
          } else if (tspan.value && Array.isArray(tspan.value)) {
            text += tspan.value[0] || "";
          } else if (tspan.value && typeof tspan.value === "string") {
            text += tspan.value;
          } else if (tspan.label && Array.isArray(tspan.label)) {
            text += tspan.label[0] || "";
          } else if (tspan.label && typeof tspan.label === "string") {
            text += tspan.label;
          } else {
            // Try to convert to string as a last resort
            try {
              const str = String(tspan);
              if (str !== "[object Object]") {
                text += str;
              }
            } catch (e) {
              // Ignore conversion errors
            }
          }
        };

        tspans.forEach(processTspan);
        return text;
      };

      // Start the recursive search from the root
      findFormFields(parsedXml);

      // If no fields were found, try looking specifically for form.field structure
      if (fields.length === 0 && parsedXml.form) {
        // Try to process each direct child of the form element
        Object.keys(parsedXml.form).forEach((key) => {
          // Skip $ property which contains attributes
          if (key === "$") return;

          const value = parsedXml.form[key];

          // Check if this is a field array
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              // For field elements
              if (key === "field") {
                const name = item.name?.[0] || item.n?.[0] || `field_${index}`;
                const type =
                  item.type?.[0] && typeof item.type[0] === "string"
                    ? item.type[0].toLowerCase() || "text"
                    : "text";
                const label = item.label?.[0] || `Field ${index + 1}`;
                const options = item.options?.[0]?.option || [];
                const required = item.required?.[0] === "true";

                fields.push({
                  id: name,
                  type,
                  label,
                  options: Array.isArray(options)
                    ? options.map((opt: any) => opt.toString())
                    : [],
                  value: item.defaultValue?.[0] || item.value?.[0] || "",
                  required,
                });
              }
              // For other element types that might be fields
              else if (elementTypeMap[key]) {
                item._fieldType = elementTypeMap[key];
                processFormField(item, fields);
              }
            });
          }
        });
      }
    } catch (error) {
      console.error("Error extracting form fields:", error);
      // Fallback with meaningful IDs
      fields.push(
        {
          id: "full_name",
          type: "text",
          label: "Sample Text Field",
          value: "",
          required: true,
        },
        {
          id: "birth_date",
          type: "date",
          label: "Sample Date Field",
          value: new Date(),
          required: true,
        },
        {
          id: "preference",
          type: "radio",
          label: "Sample Radio Buttons",
          options: ["Option 1", "Option 2", "Option 3"],
          value: "",
          required: true,
        },
        {
          id: "signature",
          type: "signature",
          label: "Sample Signature Field",
          value: "",
          required: true,
        }
      );
    }

    // Ensure we have at least one of each required field type
    const requiredTypes = ["text", "date", "radio", "signature"];
    const existingTypes = fields.map((field) => field.type);

    requiredTypes.forEach((type) => {
      if (!existingTypes.includes(type)) {
        // Add a default field of this type
        switch (type) {
          case "text":
            fields.push({
              id: "default_text",
              type,
              label: "Text Field",
              value: "",
              required: false,
            });
            break;
          case "date":
            fields.push({
              id: "default_date",
              type,
              label: "Date Field",
              value: new Date(),
              required: false,
            });
            break;
          case "radio":
            fields.push({
              id: "default_radio",
              type,
              label: "Options",
              options: ["Option 1", "Option 2", "Option 3"],
              value: "",
              required: false,
            });
            break;
          case "signature":
            fields.push({
              id: "default_signature",
              type,
              label: "Signature",
              value: "",
              required: false,
            });
            break;
        }
      }
    });

    return fields;
  };

  const handleReset = () => {
    setXmlInput("");
    setParsedResult("");
    setShowInput(false);
    setShowForm(false);
    setShowJsonResult(true);
  };

  const toggleView = () => {
    setShowJsonResult(!showJsonResult);
  };

  return (
    <SafeAreaView className="flex-1 px-4 bg-gray-100 py-10">
      <View className="w-full p-4 bg-gray-100 rounded-lg">
        {!isSourceSelected && (
          <View className="flex items-center justify-center p-4">
            <Text className="text-xl font-semibold text-gray-700">
              Generate a DynamicForm with local file or upload your xml data
            </Text>
            <Image
              source={image}
              className="w-full h-80 mt-4 rounded-lg"
              resizeMode="cover"
            />
          </View>
        )}

        <Text className="text-2xl font-bold text-center text-gray-800">
          Select an XML Source
        </Text>

        <View className="flex-row justify-center gap-5 my-4">
          <TouchableOpacity
            onPress={handleFileParse}
            className="px-4 py-2 bg-blue-500 rounded-md"
          >
            <Text className="font-semibold text-white text-xl">
              From XML File
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleInputParse}
            className="px-4 py-2 bg-[#003366] rounded-md"
          >
            <Text className="font-semibold text-white text-xl">
              From XML Input
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showInput && (
        <>
          <TextInput
            placeholder="Paste your XML here..."
            multiline
            className="border border-gray-300 p-2 mb-4 h-32 rounded text-base bg-white"
            value={xmlInput}
            onChangeText={setXmlInput}
          />
          <View className="flex-row justify-between mb-4">
            <Button
              title="Parse"
              onPress={() => parseXml(xmlInput)}
              color="green"
            />
            <Button title="Reset" onPress={handleReset} color="red" />
          </View>
        </>
      )}

      {parsedResult && (
        <View className="flex-1 border border-gray-200 rounded overflow-hidden bg-white">
          <View className="p-2 border-b border-gray-200">
            <Button
              title={showJsonResult ? "Show Form" : "Show JSON"}
              onPress={toggleView}
              color="#008080"
            />
          </View>

          {showJsonResult ? (
            <ScrollView className="p-2">
              <Text
                className={`${Platform.OS === "ios" ? "font-mono" : ""
                  } text-sm`}
              >
                {parsedResult}
              </Text>
            </ScrollView>
          ) : (
            showForm && (
              <ScrollView className="p-4">
                <Text className="text-lg font-bold mb-4 text-center">
                  Generated Form
                </Text>
                <DynamicForm fields={formFields} />
              </ScrollView>
            )
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

interface Field {
  id: string;
  type: string;
  label: string;
  options?: string[];
  value: any;
  required: boolean;
}

interface DynamicFormProps {
  fields: Field[];
}

const DynamicForm: React.FC<DynamicFormProps> = ({ fields }) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [showDatePicker, setShowDatePicker] = useState<Record<string, boolean>>(
    {}
  );

  // Helper function to safely convert any value to a string
  const safeToString = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (value._) return String(value._); // Handle xml2js object with _ property
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return "[Object]";
      }
    }
    return String(value);
  };

  const handleChange = (id: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const toggleDatePicker = (id: string) => {
    setShowDatePicker((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmit = () => {
    Alert.alert("Form Submitted", JSON.stringify(formValues, null, 2));
    // console the form
  };

  return (
    <View className="space-y-4">
      {fields.map((field) => {
        // Ensure label is a string
        const labelText = safeToString(field.label);

        switch (field.type) {
          case "text":
            return (
              <View key={field.id} className="mb-4">
                <Text className="text-base font-semibold mb-2">
                  {labelText} {field.required ? " *" : ""}
                </Text>
                <BoxedTextInput
                  value={formValues[field.id] || ""}
                  onChangeText={(text) => handleChange(field.id, text)}
                  length={
                    ["phone", "mobile", "contact"].some((word) =>
                      labelText.toLowerCase().includes(word)
                    )
                      ? 10
                      : 20
                  } // Fixed 10 for phone-like fields, 20 otherwise
                />
              </View>
            );

          case "date":
            return (
              <View key={field.id} className="mb-4">
                <Text className="text-base font-semibold mb-2">
                  {labelText}
                  {field.required ? " *" : ""}
                </Text>
                <TouchableOpacity
                  className="border border-gray-300 p-3 rounded bg-white"
                  onPress={() => toggleDatePicker(field.id)}
                >
                  <Text>
                    {formValues[field.id]
                      ? new Date(formValues[field.id]).toLocaleDateString()
                      : "Select Date"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker[field.id] && (
                  <DateTimePicker
                    value={formValues[field.id] || new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, date) => {
                      toggleDatePicker(field.id);
                      if (date) handleChange(field.id, date);
                    }}
                  />
                )}
              </View>
            );

          // In the DynamicForm component, the radio case needs to be fixed:
          case "radio":
            return (
              <View key={field.id} className="mb-4">
                <Text className="text-base font-semibold mb-2">
                  {labelText}
                  {field.required ? " *" : ""}
                </Text>
                {Array.isArray(field.options) && field.options.map((option, index) => {
                  // Ensure option is converted to string to avoid object references as keys
                  const optionString = safeToString(option);
                  return (
                    <TouchableOpacity
                      key={`${field.id}_${index}`}
                      className="flex-row items-center py-2"
                      onPress={() => handleChange(field.id, optionString)}
                    >
                      <View className="h-6 w-6 rounded-full border-2 border-zinc-500 items-center justify-center mr-2">
                        {formValues[field.id] === optionString && (
                          <View className="w-3 h-3 rounded-full bg-zinc-500" />
                        )}
                      </View>
                      <Text className="text-base">{optionString}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );

          case "signature":
            return (
              <View key={field.id} className="mb-4">
                <Text className="text-base font-semibold mb-2">
                  {labelText}
                  {field.required ? " *" : ""}
                </Text>
                <View className="h-48 border border-gray-300 rounded overflow-hidden">
                  <Signature
                    onOK={(signature) => handleChange(field.id, signature)}
                    descriptionText="Sign here"
                    clearText="Clear"
                    confirmText="Save"
                    webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`}
                  />
                </View>
              </View>
            );

          default:
            return (
              <View key={field.id} className="mb-4">
                <Text className="text-base font-semibold mb-2">
                  {labelText} (Unsupported Type: {field.type})
                </Text>
              </View>
            );
        }
      })}

      <TouchableOpacity
        className="bg-zinc-500 p-4 rounded items-center mt-4"
        onPress={handleSubmit}
      >
        <Text className="text-white text-base font-bold">Submit Form</Text>
      </TouchableOpacity>
    </View>
  );
};

export default XmlParserScreen;
