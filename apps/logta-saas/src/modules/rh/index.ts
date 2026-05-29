export { RhModuleHub } from './components/RhModuleHub';
export { RhFeatureRoute } from './components/RhFeatureRoute';
export { RhExecutiveDashboard } from './views/RhExecutiveDashboard';
export { RhAdminSectionDashboard } from './views/RhAdminSectionDashboard';
export { RhAlertasView } from './views/RhAlertasView';
export { RhDocumentosView } from './views/RhDocumentosView';
export { ControlePontoView } from './ponto/views/ControlePontoView';
export { PontoPublicView } from './ponto/views/PontoPublicView';
export { ColaboradorJornadaView } from './ponto/views/ColaboradorJornadaView';
export { EquipeInteligenteView } from './views/EquipeInteligenteView';
export { ColaboradorEquipePerfilView } from './views/ColaboradorEquipePerfilView';
export { mergeRhColaboradores } from './lib/mergeRhColaboradores';
export {
  buildEquipeRouteId,
  equipeProfileUrl,
  formatEquipeDisplayId,
  normalizeEquipeRouteId,
  resolveEquipeListRouteId,
} from './lib/equipeRouteId';
export type { RhColaboradorListItem } from './lib/mergeRhColaboradores';
export { canManageRhEquipe } from './lib/rhEquipePermissions';
export { registerRhColaborador } from './lib/registerRhColaborador';
export { NovoColaboradorModal } from './components/NovoColaboradorModal';
export { JornadaPontoLiveFeed } from './ponto/components/JornadaPontoLiveFeed';
export {
  getRhModule,
  getRhAdminHubConfig,
  getRhAdminHubForModule,
  RH_MODULES,
  RH_ADMIN_HUB_CONFIG,
  isRhAdministrativoSectionId,
  RH_ADMINISTRATIVO_SECTION_NAV,
} from './rhModules';
export type { RhAdminHubId, RhAdministrativoSectionId } from './rhModules';
