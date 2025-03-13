import React, { useEffect, useState, useRef } from "react";
import { Text, View, ScrollView, SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
// @ts-ignore
import { parseString } from "react-native-xml2js";

interface FormData {
  customerName: string;
  forename: string;
  date: {
    day: string;
    month: string;
    year: string;
  };
  signature: string;
  stage: string | null;
}

const Index = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [gElements, setGElements] = useState<any[]>([]);
  const [gElementsData, setGElementsData] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    forename: '',
    date: {
      day: '',
      month: '',
      year: '',
    },
    signature: '',
    stage: null,
  });
  
  // Create refs for date inputs to handle focus management
  const dayInputRef = useRef<TextInput>(null);
  const monthInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const loadFile = async () => {
      try {
        const asset = Asset.fromModule(require("../../assets/task_xml.txt"));
        await asset.downloadAsync();

        const fileUri = asset.localUri;
        if (!fileUri) throw new Error("File URI is null");

        const content = await FileSystem.readAsStringAsync(fileUri);
        setFileContent(content);

        parseString(content, (err: any, result: any) => {
          if (err) {
            console.error("XML Parsing Error:", err);
            return;
          }

          // Access nested elements with proper optional chaining
          const extractedGElements =
            result?.div?.div?.[0]?.svg?.[0]?.svg?.[0]?.g || [];

          setParsedData(result);
          setGElements(extractedGElements);
        });
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };

    loadFile();
  }, []);

  useEffect(() => {
    if (!gElements) console.log("No g elements found");
    const [, secondElement] = gElements;
    const g = secondElement?.g ?? [];
    setGElementsData(g);
    const rect = g[0]?.rect ?? [];
    console.log("The Chosen rect elements:", rect);
  }, [fileContent, gElements]);

  const handleInputChange = (fieldName: string, value: string) => {
    if (fieldName.includes('.')) {
      // Handle nested fields like date.day
      const [parent, child] = fieldName.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof FormData],
          [child]: value
        }
      }));
      
      // Auto-focus next field for date inputs
      if (child === 'day' && value.length === 2) {
        monthInputRef.current?.focus();
      } else if (child === 'month' && value.length === 2) {
        yearInputRef.current?.focus();
      }
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
    }
    
    // Log the updated form data
    console.log(`Field ${fieldName} updated to: ${value}`);
    setTimeout(() => {
      console.log("Current form data:", formData);
    }, 0);
  };

  const handleSubmit = () => {
    console.log("Form submitted with data:", formData);
  };

  // Helper function to create character boxes with wrapping
  const renderCharacterBoxes = (fieldName: string, value: string, maxLength: number, onChange: (text: string) => void, inputRef?: React.RefObject<TextInput>) => {
    const characters = value.split('').concat(Array(maxLength - value.length).fill(''));
    
    return (
      <View>
        <View className="flex-row flex-wrap">
          {Array.from({ length: maxLength }).map((_, index) => (
            <View 
              key={`${fieldName}-${index}`}
              className="border border-zinc-900 mb-1 items-center justify-center"
              style={{ width: 30, height: 30 }}
            >
              <Text className="text-black text-center">{characters[index] || ''}</Text>
            </View>
          ))}
        </View>
        {/* Hidden TextInput to capture keyboard input */}
        <TextInput
          ref={inputRef}
          className="absolute opacity-0 w-full h-full"
          value={value}
          onChangeText={onChange}
          maxLength={maxLength}
          keyboardType={fieldName.includes('date') ? 'numeric' : 'default'}
        />
      </View>
    );
  };

  const renderFormElements = () => {
    if (!gElementsData.length) {
      return <Text className="text-zinc-900">No form elements found</Text>;
    }

    return (
      <View className="p-4">
        {/* Customer Name */}
        <View className="mb-6">
          <Text className="text-zinc-700 mb-2 font-medium">Customer Name</Text>
          <TouchableOpacity activeOpacity={0.8} className="relative" style={{ height: 70 }}>
            {renderCharacterBoxes('customerName', formData.customerName, 20, 
              (text) => handleInputChange('customerName', text))}
          </TouchableOpacity>
        </View>

        {/* Forename */}
        <View className="mb-6">
          <Text className="text-zinc-700 mb-2 font-medium">Forename</Text>
          <TouchableOpacity activeOpacity={0.8} className="relative" style={{ height: 70 }}>
            {renderCharacterBoxes('forename', formData.forename, 20, 
              (text) => handleInputChange('forename', text))}
          </TouchableOpacity>
        </View>

        {/* Date */}
        <View className="mb-6">
          <Text className="text-zinc-700 mb-2 font-medium">Date</Text>
          <View className="flex-row items-center">
            <TouchableOpacity activeOpacity={0.8} className="relative" style={{ height: 30, width: 70 }}>
              {renderCharacterBoxes('date.day', formData.date.day, 2, 
                (text) => handleInputChange('date.day', text), dayInputRef)}
            </TouchableOpacity>
            <Text className="mx-1 text-xl">/</Text>
            <TouchableOpacity activeOpacity={0.8} className="relative" style={{ height: 30, width: 70 }}>
              {renderCharacterBoxes('date.month', formData.date.month, 2, 
                (text) => handleInputChange('date.month', text), monthInputRef)}
            </TouchableOpacity>
            <Text className="mx-1 text-xl">/</Text>
            <TouchableOpacity activeOpacity={0.8} className="relative" style={{ height: 30, width: 130 }}>
              {renderCharacterBoxes('date.year', formData.date.year, 4, 
                (text) => handleInputChange('date.year', text), yearInputRef)}
            </TouchableOpacity>
          </View>
        </View>

        {/* Signature */}
        <View className="mb-6">
          <Text className="text-zinc-700 mb-2 font-medium">Signature</Text>
          <View className="border border-black h-24 w-full">
            <TextInput
              className="h-full w-full p-2"
              multiline={true}
              value={formData.signature}
              onChangeText={(text) => handleInputChange('signature', text)}
            />
          </View>
        </View>

        {/* Stage Radio Buttons */}
        <View className="mb-6">
          <Text className="text-zinc-700 mb-2 font-medium">Stage</Text>
          <View>
            {['Stage - 1', 'Stage - 2', 'Stage - 3'].map((option) => (
              <TouchableOpacity
                key={option}
                className="flex-row items-center mb-2"
                onPress={() => handleInputChange('stage', option)}
              >
                <View className={`h-5 w-5 rounded-full border border-gray-400 mr-2 items-center justify-center ${formData.stage === option ? 'bg-white' : 'bg-white'}`}>
                  {formData.stage === option && (
                    <View className="h-3 w-3 rounded-full bg-black" />
                  )}
                </View>
                <Text>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          className="bg-zinc-700 py-3 px-4 rounded-lg items-center mt-4"
          onPress={handleSubmit}
        >
          <Text className="text-white font-medium">Submit Form</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-4 py-10">
          <Text className="text-2xl font-bold text-zinc-700 my-4">
            xml-form-app:
          </Text>
          <ScrollView className="bg-white rounded-lg shadow-sm">
            {renderFormElements()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Index;