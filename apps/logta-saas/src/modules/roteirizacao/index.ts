export {
  RoteirizacaoIntelligenceProvider,
  useRoteirizacaoIntelligence,
} from './context/RoteirizacaoIntelligenceContext';
export { RoteirizacaoAlertPopup } from './components/RoteirizacaoAlertPopup';
export { RoteirizacaoMonitoringBar } from './components/RoteirizacaoMonitoringBar';
export {
  normalizeDeliveryFromShipment,
  computeRoteirizacaoAnalytics,
  buildActiveRoutesFromDeliveries,
  deliveryToMapConfig,
} from './roteirizacaoAnalytics';
export { buildRoteirizacaoAlerts, buildRoteirizacaoIaInsights } from './roteirizacaoIntelligence';
export type { RouteDeliveryNormalized, RoteirizacaoAlert, RoteirizacaoIaInsight } from './types';
