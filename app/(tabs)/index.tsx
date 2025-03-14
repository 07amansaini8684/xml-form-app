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
  Image
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
// @ts-ignore
import { parseString } from "react-native-xml2js";
import DateTimePicker from "@react-native-community/datetimepicker";
import Signature from "react-native-signature-canvas";
import { BoxedTextInput } from "@/components/BoxTextInput";
// @ts-ignore
import image from "@/assets/images/image.jpeg"

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
      "Required Fields",
      "Please ensure your XML includes these fields:\n- Text Fields\n- Date Input\n- Radio Buttons\n- Drawing Field (Signature Box)"
    );
  };

  const parseXml = (xml: string) => {
    parseString(xml, (err: any, result: any) => {
      if (err) {
        console.error("Parsing error:", err);
        Alert.alert("Error", "Invalid XML format");
        return;
      }

      const formattedJson = JSON.stringify(result, null, 2);
      console.log("Parsed JSON:", formattedJson);
      setParsedResult(formattedJson);

      // Generate form fields from the parsed XML
      try {
        const extractedFields = extractFormFields(result);
        setFormFields(extractedFields);

        // Check if required fields are present
        const requiredTypes = ["text", "date", "radio", "signature"];
        const missingTypes = requiredTypes.filter(
          type => !extractedFields.some(field => field.type === type)
        );

        if (missingTypes.length > 0) {
          Alert.alert(
            "Missing Required Fields",
            `Your XML is missing these required field types: ${missingTypes.join(", ")}`
          );
        } else {
          setShowForm(true);
        }
      } catch (error) {
        console.error("Form extraction error:", error);
        Alert.alert("Error", "Failed to extract form fields from XML");
      }
    });
  };

  const extractFormFields = (parsedXml: any): any[] => {
    const fields: any[] = [];
    try {
      const formData = parsedXml.form?.field || [];
      const processField = (field: any, index: number) => {
        // Extract name from XML field (assuming 'name' is an element)
        const name = field.name?.[0] || `field_${index}`;
        const type = field.type?.[0]?.toLowerCase() || "text";
        const label = field.label?.[0] || `Field ${index + 1}`;
        const options = field.options?.[0]?.option || [];
        const required = field.required?.[0] === "true";

        fields.push({
          id: name, // Use extracted name as ID
          type,
          label,
          options: Array.isArray(options) ? options.map((opt: any) => opt.toString()) : [],
          value: field.defaultValue?.[0] || "",
          required,
        });
      };

      if (Array.isArray(formData)) {
        formData.forEach(processField);
      } else {
        processField(formData, 0);
      }
    } catch (error) {
      // Fallback with meaningful IDs
      fields.push(
        { id: "full_name", type: "text", label: "Sample Text Field", value: "", required: true },
        { id: "birth_date", type: "date", label: "Sample Date Field", value: new Date(), required: true },
        { id: "preference", type: "radio", label: "Sample Radio Buttons", options: ["Option 1", "Option 2", "Option 3"], value: "", required: true },
        { id: "signature", type: "signature", label: "Sample Signature Field", value: "", required: true }
      );
    }
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
            <Button title="Parse" onPress={() => parseXml(xmlInput)} color="green" />
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
              <Text className={`${Platform.OS === "ios" ? "font-mono" : ""} text-sm`}>
                {parsedResult}
              </Text>
            </ScrollView>
          ) : (
            showForm && (
              <ScrollView className="p-4">
                <Text className="text-lg font-bold mb-4 text-center">Generated Form</Text>
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
  const [showDatePicker, setShowDatePicker] = useState<Record<string, boolean>>({});

  const handleChange = (id: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const toggleDatePicker = (id: string) => {
    setShowDatePicker(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSubmit = () => {
    Alert.alert("Form Submitted", JSON.stringify(formValues, null, 2));
    // console the form 

  };

  return (
    <View className="space-y-4">
      {fields.map((field) => {
        switch (field.type) {
          case "text":
            return (
              <View key={field.id} className="mb-4">
                <Text className="text-base font-semibold mb-2">
                  {field.label} {field.required ? " *" : ""}
                </Text>
                <BoxedTextInput
                  value={formValues[field.id] || ""}
                  onChangeText={(text) => handleChange(field.id, text)}
                  length={
                    ["phone", "mobile", "contact"].some((word) =>
                      field.label.toLowerCase().includes(word)
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
                  {field.label}{field.required ? " *" : ""}
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

          case "radio":
            return (
              <View key={field.id} className="mb-4">
                <Text className="text-base font-semibold mb-2">
                  {field.label}{field.required ? " *" : ""}
                </Text>
                {field.options?.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center py-2"
                    onPress={() => handleChange(field.id, option)}
                  >
                    <View className="h-6 w-6 rounded-full border-2 border-zinc-500 items-center justify-center mr-2">
                      {formValues[field.id] === option && (
                        <View className="w-3 h-3 rounded-full bg-zinc-500" />
                      )}
                    </View>
                    <Text className="text-base">{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );

          case "signature":
            return (
              <View key={field.id} className="mb-4">
                <Text className="text-base font-semibold mb-2">
                  {field.label}{field.required ? " *" : ""}
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
                  {field.label} (Unsupported Type: {field.type})
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