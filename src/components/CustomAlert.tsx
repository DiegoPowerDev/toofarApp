import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Toast {
  title: string;
  message: string;
  bg: string;
  icon: any;
}

const BaseToast = ({ title, message, bg, icon }: Toast) => (
  <View
    style={{
      width: '90%',
      padding: 14,
      borderRadius: 14,
      backgroundColor: bg,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    }}>
    <Feather name={icon} size={22} color="#fff" />
    <View style={{ marginLeft: 12, flex: 1 }}>
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{title}</Text>
      {message && <Text style={{ color: '#eee', fontSize: 13, marginTop: 2 }}>{message}</Text>}
    </View>
  </View>
);

export const toastConfig = {
  success: (props: any) => (
    <BaseToast title={props.text1} message={props.text2} bg="#22c55e" icon="check-circle" />
  ),
  error: (props: any) => (
    <BaseToast title={props.text1} message={props.text2} bg="#ef4444" icon="x-circle" />
  ),
  info: (props: any) => (
    <BaseToast title={props.text1} message={props.text2} bg="#3b82f6" icon="info" />
  ),
  confirmDelete: ({ text1, props }: any) => (
    <View
      className="border-2 border-[#ef4444]"
      style={{
        width: '90%',
        backgroundColor: '#1f2937',
        borderRadius: 14,
        padding: 16,
      }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{text1}</Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 12,
          gap: 10,
        }}>
        <TouchableOpacity onPress={props.onCancel}>
          <Text style={{ color: '#9ca3af', fontSize: 14 }}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={props.onConfirm}>
          <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  ),
};
