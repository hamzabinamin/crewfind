declare module 'react-native-background-gradient' {
    import { ViewStyle } from 'react-native';
    
    interface BackgroundGradientProps {
      colors: string[];
      style?: ViewStyle;
    }
    
    const BackgroundGradient: React.FC<BackgroundGradientProps>;
    export default BackgroundGradient;
  }