import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, SafeAreaView, TextInput } from "react-native";
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
  const [formData, setFormData] = useState({
    customerName: '',
    forename: '',
    date: {
      day: '',
      month: '',
      year: '',
    },
    signature: '',
    stage: null,  // For radio buttons
  });

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

          // console.log("Parsed g elements:", extractedGElements);
        });
      } catch (error) {
        console.error("Error reading file:", error);
      }
    };

    loadFile();
  }, []);

  useEffect(() => {
    if (!gElements) console.log("No g elements found");
    // console.log("gElements:", gElements);
    const [, secondElement] = gElements;
    const g = secondElement?.g ?? [];
    setGElementsData(g);
    // console.log("The Chosen g elements:", gElementsData);
    const rect = g[0]?.rect ?? [];
    console.log("The Chosen rect elements:", rect);

  }
    , [fileContent, gElements]);

  const renderGElements = () => {
    if (!gElements.length) {
      return <Text className="text-zinc-900">No g elements found</Text>;
    }

    return gElements.map((gItem, index) => (
      <View key={`g-${index}`} className="mb-4 p-2 bg-gray-100 rounded">
        <Text className="text-zinc-900 text-sm font-mono">
          {JSON.stringify(gItem, null, 2)}
        </Text>
      </View>
    ));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-10">
        <Text className="text-2xl font-bold text-zinc-700 my-4">
          xml-form-app:
        </Text>
        <ScrollView className="bg-white rounded-lg shadow-sm">
          <View className="p-4">
            {Array.isArray(gElementsData) && gElementsData?.map((gItm) => (
              <View key={gItm.$.id} className="mb-4 p-2 bg-gray-100 rounded">
                <Text className="text-zinc-900 text-sm font-mono">{gItm?.$?.fdtFieldName}</Text>
                <View className="flex flex-row flex-wrap gap-[2px]">
                  {Array.isArray(gItm?.rect) && gItm?.rect?.map((rectItm: any) => (
                    <View
                      key={rectItm.$.id}
                      className="border border-black flex items-center justify-center"
                      style={{
                        width: Number(rectItm?.$?.width),
                        height: Number(rectItm?.$?.height),
                        backgroundColor: rectItm?.$?.fill || "#fff",
                        borderWidth: Number(rectItm?.$?.["stroke-width"]) || 1,
                        borderColor: rectItm?.$?.stroke || "#000",
                        opacity: Number(rectItm?.$?.["fill-opacity"]) || 1,
                      }}
                    >
                     
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};

export default Index;