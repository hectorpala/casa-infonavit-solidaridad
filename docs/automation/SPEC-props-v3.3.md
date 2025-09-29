# SPEC: props-v3.3 - Property Pipeline Specification

**Version:** props-v3.3  
**Date:** 2025-01-20  
**Status:** ACTIVE  

## Overview

This specification defines the standardized property processing pipeline for real estate automation. It covers the complete workflow from property intake through publication with 16 specialized agents.

## Core Requirements

### Brief Structure
All properties must be processed using structured Brief objects with the following required fields:

```javascript
{
    tipo: 'renta' | 'venta',
    nombre: 'string',              // Property name/title
    ubicacion: 'string',           // Full address with colonia and CP
    precio_visible: 'string',      // Formatted price with currency
    descripcion: 'string',         // Minimum 40 characters
    recamaras: number,             // Number of bedrooms
    banos: number | string,        // Number of bathrooms (supports .5)
    whatsapp_e164: 'string',       // Phone in E.164 format (+52...)
    mensaje_wa: 'string',          // WhatsApp message template
    fotos_origen: 'string'         // Absolute path to photos folder
}
```

### Asset Requirements

1. **Minimum Photos:** 6 optimized images in `images/<slug>/` directory
2. **Cover Image:** `cover.jpg` must exist in property folder
3. **Photo Format:** JPG, max 1200px width, 85% quality
4. **Naming Convention:** Sequential numbering (01, 02, 03...)

### Pipeline Phases

#### Agent #0: Brief Validation & Entry Point
- Validates brief structure and required fields
- Checks SPEC version compatibility (props-v3.3)
- Gateway for pipeline execution

#### Agents #6-#12: Core Processing Pipeline
- **#6:** Golden Source Generator (page + cards)
- **#7:** Carousel Doctor (structure validation)
- **#8:** Dual Integrator (home + culiacan)
- **#9:** WhatsApp Link (E.164 + URL encoding)
- **#10:** SEO Schema (meta tags + JSON-LD)
- **#11:** Diff Compositor (file operations)
- **#12:** Pre-publication Guard (final validation)

#### Agent #13: Authorized Publisher
- Requires authorization token: `OK_TO_APPLY=true`
- Atomic application of changes
- Live verification of deployment
- Comprehensive logging

### Output Structure

#### Generated Files
- `casa-<tipo>-<slug>.html` - Property detail page
- Updates to `index.html` - Home page card
- Updates to `culiacan/index.html` - Culiacan page card

#### Carousel Structure
```html
<div class="carousel" data-current="0">
    <div class="carousel-track">
        <div class="slide">
            <img src="../images/<slug>/<foto>.jpg" alt="..." class="carousel-image">
        </div>
        <!-- Additional slides -->
    </div>
    <div class="carousel-dots">
        <!-- Navigation dots -->
    </div>
</div>
```

### Validation Gates

#### Go/No-Go Criteria
- All agents #6-#12 must return `true` for pipeline success
- Asset validation (photos ≥6, cover.jpg exists)
- Structure validation (carousel elements present)
- Integration validation (proper insertion in home/culiacan)
- SEO validation (meta tags, schema)

#### Authorization Requirements
- Agent #13 requires human authorization token
- Token format: `OK_TO_APPLY=true`
- No publication without explicit authorization

### Error Handling

#### Motivo System
All failures must include specific `motivo` (reason) for debugging:
- Asset failures: "cover.jpg no encontrado"
- Structure failures: "slides=5 (mínimo 6)"
- Integration failures: "no insertado en home"

#### Idempotent Operations
- Canonical markers prevent duplicates
- Operations can be safely repeated
- State management through persistent objeto estado

### Compliance

#### Required Validations
1. E.164 phone format validation
2. URL encoding for WhatsApp messages
3. Minimum 6 photos requirement
4. SEO meta tag limits (title ≤60, description ≤160)
5. JSON-LD schema validation

#### Output Standards
- Responsive design compatibility
- Touch/swipe gesture support
- Lazy loading for performance
- Proper semantic HTML structure

## Implementation Notes

This specification is enforced through automated validation in the PipelineAgentes class. All agents must comply with these standards for successful property processing.

**Last Updated:** 2025-01-20  
**Compatibility:** Node.js 16+, ES2020