// src/app/logs.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { logger, LogEntry } from '@/utils/logger';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';

export default function Logs() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | LogEntry['level']>('all');
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Suscribirse a actualizaciones de logs
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === 'all' || log.level === filter;
    const matchesSearch =
      searchText === '' || log.message.toLowerCase().includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      case 'debug':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getLogBg = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'bg-blue-900/30';
      case 'success':
        return 'bg-green-900/30';
      case 'warning':
        return 'bg-yellow-900/30';
      case 'error':
        return 'bg-red-900/30';
      case 'debug':
        return 'bg-purple-900/30';
      default:
        return 'bg-gray-900/30';
    }
  };

  const getEmoji = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'debug':
        return '🐛';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const handleClearLogs = () => {
    Alert.alert('Limpiar Logs', '¿Estás seguro de que quieres eliminar todos los logs?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await logger.clearLogs();
          Alert.alert('✅ Logs eliminados', 'Todos los logs han sido borrados');
        },
      },
    ]);
  };

  const handleShareLogs = async () => {
    try {
      const logsText = await logger.exportLogs();
      await Share.share({
        message: logsText,
        title: 'GPS Amigo - Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudieron compartir los logs');
    }
  };

  const handleCopyLog = async (log: LogEntry) => {
    const text = `[${formatTimestamp(log.timestamp)}] ${getEmoji(log.level)} ${log.message}${
      log.details ? '\n' + JSON.stringify(log.details, null, 2) : ''
    }`;
    await Clipboard.setStringAsync(text);
    Alert.alert('✅ Copiado', 'Log copiado al portapapeles');
  };

  const levelCounts = logs.reduce(
    (acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    },
    {} as Record<LogEntry['level'], number>
  );

  return (
    <View className="flex-1 bg-gray-950">
      {/* Header */}
      <View className="bg-amber-600 px-4 pb-4 pt-12">
        <View className="mb-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <View className="rounded-full bg-white/20 p-2">
              <AntDesign name="arrowleft" size={24} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">📋 Logs de Sistema</Text>
          <View className="w-10" />
        </View>

        {/* Estadísticas */}
        <View className="mb-3 flex-row justify-around rounded-xl bg-white/10 p-3">
          <View className="items-center">
            <Text className="text-2xl font-bold text-white">{logs.length}</Text>
            <Text className="text-xs text-white/70">Total</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-red-400">{levelCounts.error || 0}</Text>
            <Text className="text-xs text-white/70">Errores</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-yellow-400">{levelCounts.warning || 0}</Text>
            <Text className="text-xs text-white/70">Avisos</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-green-400">{levelCounts.success || 0}</Text>
            <Text className="text-xs text-white/70">Éxitos</Text>
          </View>
        </View>

        {/* Búsqueda */}
        <TextInput
          className="rounded-xl bg-white/20 px-4 py-3 text-white placeholder:text-white/50"
          placeholder="🔍 Buscar en logs..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filtros */}
      <View className="border-b border-gray-800 bg-gray-900 px-4 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {['all', 'error', 'warning', 'success', 'info', 'debug'].map((level) => (
              <TouchableOpacity
                key={level}
                className={`rounded-full px-4 py-2 ${
                  filter === level ? 'bg-amber-600' : 'bg-gray-800'
                }`}
                onPress={() => setFilter(level as any)}>
                <Text
                  className={`font-semibold ${filter === level ? 'text-white' : 'text-gray-400'}`}>
                  {level === 'all' ? '📋 Todos' : `${getEmoji(level as any)} ${level}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Botones de acción */}
      <View className="flex-row border-b border-gray-800 bg-gray-900 px-4 py-2">
        <TouchableOpacity
          className="mr-2 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-blue-600 p-3"
          onPress={handleShareLogs}>
          <Feather name="share" size={18} color="white" />
          <Text className="font-semibold text-white">Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mr-2 flex-row items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-3"
          onPress={() => setAutoScroll(!autoScroll)}>
          <Feather name={autoScroll ? 'pause' : 'play'} size={18} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3"
          onPress={handleClearLogs}>
          <Feather name="trash-2" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* Lista de logs */}
      <ScrollView className="flex-1 px-4">
        {filteredLogs.length === 0 ? (
          <View className="mt-20 items-center">
            <Text className="text-6xl">📭</Text>
            <Text className="mt-4 text-lg text-gray-500">
              {searchText ? 'No se encontraron logs' : 'No hay logs todavía'}
            </Text>
          </View>
        ) : (
          filteredLogs.map((log) => (
            <TouchableOpacity
              key={log.id}
              className={`mb-2 rounded-lg p-3 ${getLogBg(log.level)}`}
              onLongPress={() => handleCopyLog(log)}>
              <View className="mb-1 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg">{getEmoji(log.level)}</Text>
                  <Text className={`font-mono text-xs ${getLogColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </Text>
                </View>
                <Text className="font-mono text-xs text-gray-500">
                  {formatTimestamp(log.timestamp)}
                </Text>
              </View>

              <Text className="font-mono text-sm text-white">{log.message}</Text>

              {log.details && (
                <View className="mt-2 rounded bg-black/30 p-2">
                  <Text className="font-mono text-xs text-gray-400">
                    {typeof log.details === 'string'
                      ? log.details
                      : JSON.stringify(log.details, null, 2)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        <View className="h-20" />
      </ScrollView>

      {/* Info de ayuda */}
      <View className="border-t border-gray-800 bg-gray-900 px-4 py-2">
        <Text className="text-center text-xs text-gray-500">
          💡 Mantén presionado un log para copiarlo
        </Text>
      </View>
    </View>
  );
}
