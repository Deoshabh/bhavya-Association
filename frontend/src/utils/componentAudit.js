/**
 * Component Audit Utility
 * 
 * This utility helps track Tailwind CSS usage in components to identify
 * opportunities for refactoring and creating component classes.
 */

// Common Tailwind class combinations that could be extracted
const commonPatterns = [
  {
    name: 'flex-center',
    pattern: /flex\s+items-center\s+justify-center/,
    suggestion: 'Replace with .flex-center class'
  },
  {
    name: 'card',
    pattern: /bg-white\s+rounded(-lg)?\s+shadow(-md)?(\s+overflow-hidden)?/,
    suggestion: 'Replace with .card class'
  },
  {
    name: 'button-primary',
    pattern: /bg-primary\s+text-white(\s+rounded(-md)?)?\s+hover:bg-primary-dark/,
    suggestion: 'Replace with .btn.btn-primary classes'
  },
  {
    name: 'form-input',
    pattern: /block\s+w-full\s+px-\d\s+py-\d\s+border\s+border-neutral-300\s+rounded(-md)?\s+shadow-sm/,
    suggestion: 'Replace with .form-input class'
  }
];

// Colors that should use the theme's color system
const colorPatterns = [
  {
    pattern: /bg-(red|blue|green|yellow|gray)-\d00/,
    suggestion: 'Use theme colors instead (primary, secondary, etc.)'
  },
  {
    pattern: /text-(red|blue|green|yellow|gray)-\d00/,
    suggestion: 'Use theme colors instead (primary, secondary, etc.)'
  }
];

/**
 * Analyze a component's JSX code for Tailwind patterns that could be refactored
 * @param {string} code - The component's code
 * @return {Object} Analysis results
 */
export const analyzeComponent = (code) => {
  if (!code) return { patterns: [], colors: [] };
  
  const results = {
    patterns: [],
    colors: []
  };
  
  // Check for common patterns
  commonPatterns.forEach(pattern => {
    if (pattern.pattern.test(code)) {
      results.patterns.push({
        name: pattern.name,
        suggestion: pattern.suggestion
      });
    }
  });
  
  // Check for color usage
  colorPatterns.forEach(pattern => {
    const matches = code.match(new RegExp(pattern.pattern, 'g'));
    if (matches) {
      matches.forEach(match => {
        if (!results.colors.some(c => c.match === match)) {
          results.colors.push({
            match,
            suggestion: pattern.suggestion
          });
        }
      });
    }
  });
  
  return results;
};

/**
 * Generate a refactoring report for multiple components
 * @param {Object} components - Object with component names as keys and code as values
 * @return {Object} Consolidated report
 */
export const generateRefactoringReport = (components) => {
  const report = {
    totalComponents: Object.keys(components).length,
    componentsNeedingRefactoring: 0,
    patternFrequency: {},
    colorUsage: {},
    componentDetails: {}
  };
  
  Object.entries(components).forEach(([name, code]) => {
    const analysis = analyzeComponent(code);
    
    if (analysis.patterns.length > 0 || analysis.colors.length > 0) {
      report.componentsNeedingRefactoring++;
      report.componentDetails[name] = analysis;
      
      // Count pattern frequency
      analysis.patterns.forEach(pattern => {
        report.patternFrequency[pattern.name] = (report.patternFrequency[pattern.name] || 0) + 1;
      });
      
      // Count color usage
      analysis.colors.forEach(color => {
        report.colorUsage[color.match] = (report.colorUsage[color.match] || 0) + 1;
      });
    }
  });
  
  return report;
};

export default {
  analyzeComponent,
  generateRefactoringReport
};
