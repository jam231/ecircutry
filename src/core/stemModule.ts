import type { LevelDefinition } from '../engine/types';

export interface StemModuleDescriptor {
  id: string;
  name: string;
  tagline: string;
  status: 'active' | 'coming-soon';
  accentColor: string;
  adultLevels: LevelDefinition[];
  kidMissions: LevelDefinition[];
  adultSandbox: LevelDefinition;
  kidSandbox: LevelDefinition;
}

/**
 * Extensible registry allowing future STEM disciplines (Chemistry, Mechanics, Optics)
 * to plug into the same dual-mode campaign shell and progress tracker.
 */
class StemModuleRegistry {
  private modules = new Map<string, StemModuleDescriptor>();

  register(mod: StemModuleDescriptor): void {
    this.modules.set(mod.id, mod);
  }

  get(id: string): StemModuleDescriptor | undefined {
    return this.modules.get(id);
  }

  list(): StemModuleDescriptor[] {
    return Array.from(this.modules.values());
  }
}

export const stemRegistry = new StemModuleRegistry();
