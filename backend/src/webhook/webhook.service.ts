import { Injectable, Logger } from '@nestjs/common';
import { EventService } from '../events/events.service';
import { SheetsService } from '../sheets/sheets.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  private timer: NodeJS.Timeout | null = null;
  private pending = false;
  private running = false;

  private readonly debounceMs = 5000;

  constructor(
    private readonly sheetService: SheetsService,
    private readonly eventService: EventService,
  ) {}

  onSheetsUpdate() {
    this.pending = true;

    if (this.running) return;

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.runSyncSafely(), this.debounceMs);
  }

  private async runSyncSafely() {
    if (!this.pending || this.running) return;

    this.pending = false;
    this.running = true;

    try {
      const result = await this.sheetService.syncProducts();


      const hasChanges =
        result.added > 0 || result.updated > 0 || result.deleted > 0;

      if (hasChanges) {
        this.eventService.emitProductsUpdated(this.getTodayDDMM());
        this.logger.log('products_updated mandado pro front');
      } else {
        this.logger.log('ℹ️não emiti evento pro front');
      }
    } catch (e: any) {
      this.logger.error(`erro no syncProducts: ${e?.message}`);
    } finally {
      this.running = false;

      if (this.pending) {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.runSyncSafely(), this.debounceMs);
      }
    }
  }

  private getTodayDDMM() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth() + 1).padStart(2,'0');
    return `${dd}-${mm}`;
    }
}
