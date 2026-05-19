export { RhModuleHub } from './components/RhModuleHub';
export { RhFeatureRoute } from './components/RhFeatureRoute';
export { RhExecutiveDashboard } from './views/RhExecutiveDashboard';
export { RhAdminSectionDashboard } from './views/RhAdminSectionDashboard';
export { RhAlertasView } from './views/RhAlertasView';
export { RhDocumentosView } from './views/RhDocumentosView';
export { ControlePontoView } from './ponto/views/ControlePontoView';
export { PontoPublicView } from './ponto/views/PontoPublicView';
export { ColaboradorJornadaView } from './ponto/views/ColaboradorJornadaView';
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
