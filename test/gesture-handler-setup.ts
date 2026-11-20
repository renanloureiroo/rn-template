jest.mock("react-native-gesture-handler/src/handlers/gestures/installUIRuntimeBindings", () =>
  require("react-native-gesture-handler/src/handlers/gestures/installUIRuntimeBindings.web"),
)

jest.mock(
  "react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings",
  () =>
    require("react-native-gesture-handler/lib/module/handlers/gestures/installUIRuntimeBindings.web"),
)
