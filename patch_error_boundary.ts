import fs from 'fs';

const file = 'src/components/AssignedExercisesView.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { ErrorBoundary }')) {
  content = content.replace(
    `import { syncHomeworkToGoogleSheets } from '../services/googleAppsScriptService';`,
    `import { syncHomeworkToGoogleSheets } from '../services/googleAppsScriptService';\nimport { ErrorBoundary } from './ErrorBoundary';`
  );
}

const modalContent = `              <div className="overflow-y-auto pr-2 flex-1">
                <ErrorBoundary onReset={() => setSelectedExercise(null)}>`;

if (!content.includes('<ErrorBoundary onReset')) {
  content = content.replace(
    `<div className="overflow-y-auto pr-2 flex-1">`,
    modalContent
  );

  content = content.replace(
    `              </div>\n            </motion.div>\n          </div>\n        )}\n      </AnimatePresence>`,
    `                </ErrorBoundary>\n              </div>\n            </motion.div>\n          </div>\n        )}\n      </AnimatePresence>`
  );
}

fs.writeFileSync(file, content);
console.log('Added ErrorBoundary to AssignedExercisesView');
