import { useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface BoxedTextInputProp {
    value: string;
    onChangeText: (text: string) => void;
    length?: number;
}

export const BoxedTextInput = ({ value, onChangeText, length = 10 }: BoxedTextInputProp) => {
    const inputRef = useRef<TextInput>(null);
    const [dynamicLength, setDynamicLength] = useState(length);

    if (value.length > dynamicLength) {
        setDynamicLength(value.length);
    }

    const chars = value.split('').slice(0, dynamicLength);
    const emptyChars = Array(dynamicLength - chars.length).fill('');

    const handlePress = () => {
        inputRef.current?.focus();
    };

    // console.log("The length is:", dynamicLength);

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={1}>
            <View className="flex-row flex-wrap justify-start gap-[1px] w-full ">
                {[...chars, ...emptyChars].map((char, index) => (
                    <View
                        key={index}
                        className="w-8 h-8 border-[1px] border-zinc-500 rounded-sm items-center justify-center"
                    >
                        <Text className="text-2xl font-bold text-gray-700">{char}</Text>
                    </View>
                ))}
            </View>

            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChangeText}
                className="absolute opacity-0"
                maxLength={dynamicLength}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
            />
        </TouchableOpacity>
    );
};
