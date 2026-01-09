import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import AntDesign from '@expo/vector-icons/AntDesign';

import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import Foundation from '@expo/vector-icons/Foundation';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';

import { View, Text, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function About() {
  const router = useRouter();

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-black/80">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className=" flex bg-amber-600 p-8  ">
          <TouchableOpacity onPress={() => router.push('/')} className="mb-4">
            <View className="flex-row gap-2">
              <Ionicons name="arrow-back" size={24} color="white" />
              <Text className="text-base text-white">Volver</Text>
            </View>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <AntDesign name="info-circle" size={24} color="white" />
            <Text className="mb-1 text-3xl font-bold text-white">Acerca de</Text>
          </View>
          <Text className="text-base text-white/80">GPS Amigo v0.1.0</Text>
        </View>

        {/* Descripción */}
        <View className="m-4 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-xl font-bold text-gray-800">¿Qué es esta app?</Text>

          <Text className="mb-3 text-sm leading-6 text-gray-600">
            <Text className="font-bold">GPS Amigo</Text> es una aplicación diseñada para alertarte
            cuando te acerques a tu destino. Perfecta para viajes largos en transporte público.
          </Text>

          <Text className="text-sm leading-6 text-gray-600">
            La app utiliza tu <Text className="font-bold">GPS</Text> nativo para avisarte cuando
            estés cerca de tu destino seleccionado por lo que no requiere conexión a internet.
          </Text>
        </View>

        {/* Cómo usar */}
        <View className="m-4 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-xl font-bold text-gray-800"> Cómo usar la app</Text>

          <View className="mb-4 rounded-xl bg-amber-200 p-4">
            <Text className="mb-2 text-base font-bold text-gray-800">Selecciona tu destion</Text>
            <View className="flex-row justify-center">
              <Image
                source={require('../../assets/step1.webp')}
                resizeMode="contain"
                className="flex h-64 w-full object-contain"
              />
            </View>

            <Text className="text-sm leading-6 text-gray-600">
              Toca el botón <Text className="font-bold">"Abrir mapa completo"</Text> y elige el
              punto exacto donde quieres que te alerte. Puedes tocar en cualquier parte del mapa.
            </Text>
          </View>

          <View className="mb-4 rounded-xl bg-blue-200 p-4">
            <Text className="mb-2 text-base font-bold text-gray-800">
              Configura el radio de alerta
            </Text>
            <View className="flex-row justify-center">
              <Image
                resizeMode="contain"
                className="flex h-64 w-full object-contain"
                source={require('../../assets/step2.webp')}
              />
            </View>
            <Text className=" text-sm leading-6 text-gray-600">
              Elige la distancia a la que quieres recibir la alerta: desde 100 metros hasta 1
              kilómetro.
            </Text>
          </View>

          <View className="mb-4 rounded-xl bg-green-200 p-4">
            <Text className="mb-2 text-base font-bold text-gray-800">Inicia el tu viaje</Text>
            <View className="flex-row justify-center">
              <Image
                resizeMode="contain"
                source={require('../../assets/step3.webp')}
                className="flex h-64 w-full object-contain"
              />
            </View>
            <Text className=" text-sm leading-6 text-gray-600">
              Presiona <Text className="font-bold">"Comencemos"</Text> y viaja tranquilo. La app
              seguirá funcionando incluso si la pantalla está bloqueada.
            </Text>
          </View>

          <View className="mb-4 rounded-xl bg-red-200 p-4">
            <Text className="mb-2 text-base font-bold text-gray-800">Recibe la alerta</Text>
            <View className="flex-row justify-center">
              <Image
                source={require('../../assets/step4.webp')}
                resizeMode="contain"
                className="flex h-40 w-full object-contain"
              />
            </View>
            <Text className="text-sm leading-6 text-gray-600">
              Cuando llegues cerca de tu destino, recibirás una notificación con sonido y vibración
              para avisarte.
            </Text>
          </View>
        </View>

        {/* Características */}
        <View className="m-4 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="mb-3 px-3 text-xl font-bold text-gray-800">Características</Text>

          <View className="mb-3 flex-row items-center gap-4 rounded-2xl bg-lime-400 p-2 px-3">
            <Entypo name="map" size={24} color="black" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">Mapas nativos</Text>
              <Text className="text-sm text-gray-600">
                Usa Apple Maps en iOS y mapas del sistema en Android
              </Text>
            </View>
          </View>

          <View className="mb-3 flex-row items-center gap-4 rounded-2xl bg-amber-400 p-2 px-3">
            <Feather name="bell" size={24} color="black" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">Alertas potentes</Text>
              <Text className="text-sm text-gray-600">
                Notificaciones con sonido y vibración fuerte
              </Text>
            </View>
          </View>

          <View className="mb-3 flex-row items-center gap-4 rounded-2xl bg-blue-400 p-2 px-3">
            <MaterialIcons name="place" size={24} color="black" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">Lugares guardados</Text>
              <Text className="text-sm text-gray-600">
                Guarda tus ubicaciones frecuentes para acceso rápido
              </Text>
            </View>
          </View>

          <View className="mb-3 flex-row items-center gap-4 rounded-2xl bg-sky-300 p-2 px-3">
            <MaterialCommunityIcons name="cellphone-lock" size={24} color="black" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                Monitoreo en segundo plano
              </Text>
              <Text className="text-sm text-gray-600">
                Funciona incluso con la pantalla bloqueada
              </Text>
            </View>
          </View>

          <View className="mb-3 flex-row items-center gap-4 rounded-2xl bg-slate-300 p-2 px-3">
            <MaterialIcons name="radar" size={24} color="black" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">Radio personalizable</Text>
              <Text className="text-sm text-gray-600">
                Ajusta la distancia de alerta según tus necesidades
              </Text>
            </View>
          </View>
        </View>

        {/* Consejos */}
        <View className="m-4 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-xl font-bold text-gray-800">Consejos importantes</Text>

          <View className="mb-3 rounded-2xl bg-yellow-200 p-4">
            <View className="flex-col gap-2">
              <View className="flex-row">
                <Foundation name="alert" size={24} color="black" />
                <Text className="font-bold"> Permisos: </Text>
              </View>
              <Text>
                Asegúrate de otorgar permisos de ubicación "Siempre" y notificaciones para que la
                app funcione correctamente.
              </Text>
            </View>
          </View>

          <View className="mb-3 rounded-2xl bg-amber-100 p-4">
            <View className="flex-col gap-2">
              <View className="flex-row gap-2">
                <Entypo name="battery" size={24} color="black" />
                <Text className="font-bold">Batería: </Text>
              </View>
              <Text>
                El monitoreo GPS consume batería. Te recomendamos mantener tu dispositivo cargando
                durante viajes largos.
              </Text>
            </View>
          </View>

          <View className="rounded-2xl bg-blue-200 p-4">
            <View className="flex-col gap-2">
              <View className="flex-row gap-2">
                <MaterialIcons name="signal-wifi-connected-no-internet-4" size={24} color="black" />
                <Text className="font-bold">Conectividad: </Text>
              </View>
              <Text className=" ">La app funciona sin internet, solo necesita GPS activo.</Text>
            </View>
          </View>
        </View>

        {/* Contacto */}
        <View className="m-4 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="mb-3 text-xl font-bold text-gray-800">Contacto y soporte</Text>

          <TouchableOpacity
            onPress={() => openLink('mailto:diegopacherres15@gmail.com')}
            className="mb-3 flex-row items-center gap-4 rounded-xl bg-gray-50 p-4">
            <Feather name="mail" size={24} color="black" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">Email</Text>
              <Text className="text-sm text-indigo-600">diegopacherres15@gmail.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openLink('https://github.com/DiegoPowerDev')}
            className="mb-3 flex-row items-center gap-4 rounded-xl bg-gray-50 p-4">
            <FontAwesome6 name="github" size={24} color="black" />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">GitHub</Text>
              <Text className="text-sm text-indigo-600">DiegoPowerDev</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center pb-8">
          <Text className="px-4 text-center text-sm text-gray-400">
            Hecho con ❤️ para viajeros que se pasaron el paradero luego de volver cansados del
            trabajo
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/logs')} className="mb-4">
          <View className="flex-row gap-2">
            <Entypo name="text-document" size={24} color="white" />
            <Text className="text-base text-white">Logs</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
