import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Spacing } from '@/constants/theme';
import { AppCard } from './app-card';
import { AppText } from './app-text';

export interface ChartMeasurement { date: string; weight: number }

export function WeightChart({ measurements }: { measurements: readonly ChartMeasurement[] }) {
  const points = measurements.filter((item) => Number.isFinite(item.weight) && item.weight > 0 && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(Date.parse(item.date + 'T12:00:00Z'))).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (!points.length) return <AppCard><AppText variant="sectionTitle">Evolución de tu peso</AppText><AppText color="textSecondary">Tu gráfica estará disponible cuando tengas mediciones registradas.</AppText></AppCard>;
  const weights = points.map((point) => point.weight);
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const firstDate = Date.parse(points[0].date + 'T12:00:00Z');
  const span = Date.parse(points[points.length - 1].date + 'T12:00:00Z') - firstDate;
  const coords = points.map((point) => ({ x: points.length === 1 ? 175 : 50 + (span === 0 ? 0.5 : (Date.parse(point.date + 'T12:00:00Z') - firstDate) / span) * 255, y: 150 - ((point.weight - min) / (max - min)) * 122 }));
  const line = coords.map((p) => p.x + ',' + p.y).join(' ');
  const grid = Array.from({ length: 4 }, (_, i) => {
    const y = 28 + i * 122 / 3;
    return '<path d="M45 ' + y + 'H315" stroke="#E7E9ED" stroke-dasharray="4 4"/><text x="36" y="' + (y + 4) + '" text-anchor="end" font-family="sans-serif" font-size="10" fill="#667085">' + (max - i * (max - min) / 3).toFixed(1) + '</text>';
  }).join('');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="330" height="180" viewBox="0 0 330 180"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8CC63F" stop-opacity=".22"/><stop offset="1" stop-color="#8CC63F" stop-opacity="0"/></linearGradient></defs>' + grid + '<polygon points="' + coords[0].x + ',150 ' + line + ' ' + coords[coords.length - 1].x + ',150" fill="url(#area)"/><polyline points="' + line + '" fill="none" stroke="#77AD2E" stroke-width="2.5"/>' + coords.map((point) => '<circle cx="' + point.x + '" cy="' + point.y + '" r="4" fill="#77AD2E" stroke="white" stroke-width="1.5"/>').join('') + '</svg>';
  const dateLabel = (value: string) => new Date(value + 'T12:00:00Z').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return (
    <AppCard style={styles.card}>
      <AppText variant="sectionTitle" accessibilityRole="header">Evolución de tu peso</AppText>
      <AppText variant="auxiliary" color="textSecondary">Peso en kg · {points.length} {points.length === 1 ? 'medición' : 'mediciones'}</AppText>
      <Image source={{ uri: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg) }} contentFit="contain" style={styles.chart} accessibilityLabel={'Gráfica de peso. ' + points.map((point) => dateLabel(point.date) + ': ' + point.weight + ' kg').join('. ')} accessible />
      <View style={styles.dates}><AppText variant="auxiliary" color="textSecondary">{dateLabel(points[0].date)}</AppText>{points.length > 1 ? <AppText variant="auxiliary" color="textSecondary">{dateLabel(points[points.length - 1].date)}</AppText> : null}</View>
      {points.length === 1 ? <AppText variant="auxiliary" color="textSecondary">Con tu siguiente medición podrás comparar tu evolución.</AppText> : null}
    </AppCard>
  );
}
const styles = StyleSheet.create({ card: { gap: Spacing.sm }, chart: { width: '100%', aspectRatio: 330 / 180 }, dates: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.xs } });
