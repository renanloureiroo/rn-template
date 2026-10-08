import { useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Pressable, Switch as RNSwitch, Text, TextInput as RNTextInput, View } from "react-native"
import type {
  ButtonProps,
  ListItemProps,
  ListProps,
  SwitchProps,
  TextInputProps,
  UniversalHostProps,
} from "@expo/ui"

// O Expo UI desenha SwiftUI/Compose, que não existe no Jest. Este fake cobre só o subconjunto
// usado pelos componentes de src/shared/components, com primitivas do React Native. As props vêm
// dos tipos reais do @expo/ui: se a API da biblioteca mudar, o typecheck quebra aqui.

export function Host({ children, style, testID }: UniversalHostProps) {
  return (
    <View style={style} testID={testID}>
      {children}
    </View>
  )
}

export function Button({ label, children, onPress, disabled, testID }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      {children ?? <Text>{label}</Text>}
    </Pressable>
  )
}

export function TextInput({
  defaultValue,
  editable,
  maxLength,
  onBlur,
  onChangeText,
  onFocus,
  onSubmitEditing,
  placeholder,
  testID,
}: TextInputProps) {
  const [text, setText] = useState(defaultValue ?? "")
  return (
    <RNTextInput
      editable={editable}
      maxLength={maxLength}
      onBlur={onBlur}
      onChangeText={(value) => {
        setText(value)
        onChangeText?.(value)
      }}
      onFocus={onFocus}
      onSubmitEditing={() => onSubmitEditing?.(text)}
      placeholder={placeholder}
      testID={testID}
      value={text}
    />
  )
}

export function Switch({ value, onValueChange, label, disabled, testID }: SwitchProps) {
  return (
    <View>
      {label ? <Text>{label}</Text> : null}
      <RNSwitch disabled={disabled} onValueChange={onValueChange} testID={testID} value={value} />
    </View>
  )
}

export function List({ children, testID }: ListProps) {
  return <View testID={testID}>{children}</View>
}

export function ListItem({ children, supportingText, trailing, onPress, testID }: ListItemProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} testID={testID}>
      {typeof children === "string" ? <Text>{children}</Text> : children}
      {typeof supportingText === "string" ? <Text>{supportingText}</Text> : supportingText}
      {trailing}
    </Pressable>
  )
}
