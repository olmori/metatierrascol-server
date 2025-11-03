import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SanitizerService {
  constructor(
    private sanitizer: DomSanitizer
  ) {}
  sanitizeResource(multimediaResource) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(multimediaResource);
  }
}
