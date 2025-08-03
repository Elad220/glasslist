/**
 * AI Feature Cooldown Manager
 * Implements a 2-hour cooldown mechanism for AI features
 */

const COOLDOWN_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const STORAGE_PREFIX = 'ai_cooldown_';

export interface CooldownData {
  lastUpdate: number;
  data?: any;
}

export class CooldownManager {
  private featureName: string;
  private storageKey: string;

  constructor(featureName: string) {
    this.featureName = featureName;
    this.storageKey = `${STORAGE_PREFIX}${featureName}`;
  }

  /**
   * Check if the feature is within cooldown period
   */
  isInCooldown(): boolean {
    const data = this.getCooldownData();
    if (!data || !data.lastUpdate) return false;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - data.lastUpdate;
    
    return timeSinceLastUpdate < COOLDOWN_DURATION;
  }

  /**
   * Get the time remaining in cooldown (in milliseconds)
   */
  getTimeRemaining(): number {
    const data = this.getCooldownData();
    if (!data || !data.lastUpdate) return 0;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - data.lastUpdate;
    const remaining = COOLDOWN_DURATION - timeSinceLastUpdate;
    
    return Math.max(0, remaining);
  }

  /**
   * Get human-readable time remaining
   */
  getTimeRemainingText(): string {
    const remaining = this.getTimeRemaining();
    if (remaining === 0) return 'Ready to refresh';
    
    const minutes = Math.floor(remaining / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m until next refresh`;
    }
    return `${remainingMinutes}m until next refresh`;
  }

  /**
   * Get the last update time
   */
  getLastUpdateTime(): Date | null {
    const data = this.getCooldownData();
    if (!data || !data.lastUpdate) return null;
    
    return new Date(data.lastUpdate);
  }

  /**
   * Get human-readable last update time
   */
  getLastUpdateText(): string {
    const lastUpdate = this.getLastUpdateTime();
    if (!lastUpdate) return 'Never updated';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Update the cooldown timestamp and optionally store data
   */
  updateCooldown(data?: any): void {
    const cooldownData: CooldownData = {
      lastUpdate: Date.now(),
      data
    };
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(cooldownData));
    } catch (error) {
      console.error(`Failed to update cooldown for ${this.featureName}:`, error);
    }
  }

  /**
   * Get stored cooldown data
   */
  getCooldownData(): CooldownData | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch (error) {
      console.error(`Failed to get cooldown data for ${this.featureName}:`, error);
      return null;
    }
  }

  /**
   * Get cached data if available and not expired
   */
  getCachedData(): any | null {
    if (this.isInCooldown()) {
      const data = this.getCooldownData();
      return data?.data || null;
    }
    return null;
  }

  /**
   * Clear cooldown data
   */
  clearCooldown(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error(`Failed to clear cooldown for ${this.featureName}:`, error);
    }
  }

  /**
   * Force refresh (bypasses cooldown)
   */
  forceRefresh(): void {
    this.clearCooldown();
  }
}

// Export pre-configured cooldown managers for each AI feature
export const genAIInsightsCooldown = new CooldownManager('genai_insights');
export const smartShoppingTipsCooldown = new CooldownManager('smart_shopping_tips');
export const aiShoppingAnalyticsCooldown = new CooldownManager('ai_shopping_analytics');
export const aiSuggestionsCooldown = new CooldownManager('ai_suggestions');