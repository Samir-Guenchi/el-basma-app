/**
 * Settings Repository Interface
 * Dependency Inversion: High-level modules depend on abstractions
 * Interface Segregation: Focused interface for settings operations
 */

export interface ISettingsRepository {
  get(): Promise<Record<string, unknown>>;
  update(settings: Record<string, unknown>): Promise<Record<string, unknown>>;
}
