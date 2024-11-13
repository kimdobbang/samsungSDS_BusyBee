import { Stack } from '@chakra-ui/react';

import {
  StepsCompletedContent,
  StepsItem,
  StepsList,
  StepsRoot,
} from 'components/ui/steps';

interface StepProps {
  currentStep: number;
}

export const Step = ({ currentStep }: StepProps) => {
  return (
    <Stack gap='16' width='full'>
      <StepsRoot
        variant={'solid'}
        size={'lg'}
        defaultValue={1}
        count={5}
        step={currentStep}
        colorPalette={'blue'}
      >
        <StepsList>
          <StepsItem
            index={0}
            title='견적 요청'
            style={{ pointerEvents: 'none' }}
          />
          <StepsItem
            index={1}
            title='견적 발급'
            style={{ pointerEvents: 'none' }}
          />
          <StepsItem index={2} title='주문' style={{ pointerEvents: 'none' }} />
          <StepsItem
            index={3}
            title='운송중'
            style={{ pointerEvents: 'none' }}
          />
          <StepsItem
            index={4}
            title='운송 완료'
            style={{ pointerEvents: 'none' }}
          />
        </StepsList>
        <StepsCompletedContent>All steps are complete!</StepsCompletedContent>
      </StepsRoot>
    </Stack>
  );
};
