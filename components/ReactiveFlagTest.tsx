"use client";

import { useLaunchDarkly } from '@/hooks/useLaunchDarkly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function ReactiveFlagTest() {
  const { flags, getFlagValue, client } = useLaunchDarkly();
  const [updateCount, setUpdateCount] = useState(0);

  // Track when flags change
  useEffect(() => {
    setUpdateCount(prev => prev + 1);
    console.log('Flags updated, getFlagValue will now return new values');
  }, [flags]);

  const testFlagValue = getFlagValue('showFlagsTab', false);
  const directFlagValue = flags.showFlagsTab;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reactivity Test</CardTitle>
        <CardDescription>
          Demonstrating that getFlagValue is reactive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Update Counter:</h4>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Flag Updates Detected:</span>
              <Badge variant="outline" className="text-xs">
                {updateCount}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Values:</h4>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">getFlagValue('showFlagsTab'):</span>
              <Badge variant={testFlagValue ? "default" : "secondary"}>
                {String(testFlagValue)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">flags.showFlagsTab:</span>
              <Badge variant={directFlagValue ? "default" : "secondary"}>
                {String(directFlagValue)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Test Instructions:</h4>
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>1. Open LaunchDarkly dashboard</p>
            <p>2. Change the showFlagsTab flag value</p>
            <p>3. Watch the values update automatically</p>
            <p>4. Both getFlagValue and direct access are reactive</p>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('Current flag values:', {
                getFlagValue: testFlagValue,
                directAccess: directFlagValue,
                allFlags: flags
              });
            }}
          >
            Log Current Values
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 