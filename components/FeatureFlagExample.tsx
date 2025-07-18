"use client";

import { useLaunchDarkly } from '@/hooks/useLaunchDarkly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

export default function FeatureFlagExample() {
  const { flags, getFlagValue, client } = useLaunchDarkly();
  const [renderCount, setRenderCount] = useState(0);

  // Track re-renders to show reactivity
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [flags]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>LaunchDarkly Feature Flags</CardTitle>
        <CardDescription>
          Current flag values from LaunchDarkly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Reactivity Info:</h4>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Component Re-renders:</span>
              <Badge variant="outline" className="text-xs">
                {renderCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Last Flag Update:</span>
              <Badge variant="outline" className="text-xs">
                {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Context Information:</h4>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Session ID:</span>
              <Badge variant="outline" className="text-xs">
                {typeof window !== 'undefined' && localStorage.getItem('ld_session_id')?.substring(0, 20)}...
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">User Key:</span>
              <Badge variant="outline" className="text-xs">
                {(() => {
                  const context = client?.getContext();
                  if (context && 'user' in context) {
                    return context.user?.key || 'N/A';
                  }
                  return 'N/A';
                })()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">User Name:</span>
              <Badge variant="outline" className="text-xs">
                {(() => {
                  const context = client?.getContext();
                  if (context && 'user' in context) {
                    return context.user?.name || 'N/A';
                  }
                  return 'N/A';
                })()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Auto Updates:</span>
              <Badge variant="default" className="text-xs">
                Enabled
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">All Flags:</h4>
          <div className="text-xs space-y-1">
            {Object.entries(flags).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-mono">{key}:</span>
                <Badge variant={value ? "default" : "secondary"}>
                  {String(value)}
                </Badge>
              </div>
            ))}
            {Object.keys(flags).length === 0 && (
              <p className="text-muted-foreground">No flags available</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">getFlagValue Examples (Reactive):</h4>
          <div className="text-xs space-y-1">
            <div>
              <span className="font-medium">getFlagValue('showFlagsTab', false):</span>{' '}
              <Badge variant={getFlagValue('showFlagsTab', false) ? "default" : "secondary"}>
                {String(getFlagValue('showFlagsTab', false))}
              </Badge>
            </div>
            <div>
              <span className="font-medium">getFlagValue('new-feature', false):</span>{' '}
              <Badge variant={getFlagValue('new-feature', false) ? "default" : "secondary"}>
                {String(getFlagValue('new-feature', false))}
              </Badge>
            </div>
            <div>
              <span className="font-medium">getFlagValue('welcome-message', 'Hello!'):</span>{' '}
              <Badge variant="outline">
                {String(getFlagValue('welcome-message', 'Hello!'))}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Direct Flag Access (Also Reactive):</h4>
          <div className="text-xs space-y-1">
            <div>
              <span className="font-medium">flags.showFlagsTab:</span>{' '}
              <Badge variant={flags.showFlagsTab ? "default" : "secondary"}>
                {String(flags.showFlagsTab)}
              </Badge>
            </div>
            <div>
              <span className="font-medium">flags['new-feature']:</span>{' '}
              <Badge variant={flags['new-feature'] ? "default" : "secondary"}>
                {String(flags['new-feature'])}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 