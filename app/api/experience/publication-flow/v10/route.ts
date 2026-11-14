import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const step = body.step || 'START';

    // State machine steps matching BlaBlaCar publication-flow v10
    const responsePayload = {
      step: `STEP_${step}`,
      stepName: step === 'START' ? 'DEPARTURE' : step,
      screen_title: step === 'START' || step === 'DEPARTURE' ? 'Pick-up' : step,
      auto_complete_place_holder: 'Enter the full address',
      suggestions_history: [
        {
          id: 'ChIJsc1rHzcjjsRJLjyQ31LpqU',
          main_text: '27, 6th Cross Rd',
          secondary_text: 'Visveshwaraiah Layout, Bengaluru, Karnataka',
          user_history: true
        },
        {
          id: 'ChIJ5SJhss4wkrjsR8XFKJ1tqEVg',
          main_text: 'KSCA Stadium',
          secondary_text: 'Alur, Bengaluru, Karnataka',
          user_history: true
        },
        {
          id: 'ChIJbU60yXAWkrjsR4E9-UejD3_g',
          main_text: 'Bengaluru, Karnataka',
          secondary_text: 'India',
          user_history: true
        }
      ],
      navigation: {
        can_go_back: step !== 'START' && step !== 'DEPARTURE',
        current_step_number: step === 'START' ? 1 : 2,
        total_step_count: 6
      }
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
